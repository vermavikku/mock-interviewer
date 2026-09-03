import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { SessionQuestion, SessionEvaluation } from '../session-storage/session-json.service';
import { getErrorMessage } from '../../shared/utils/error.util';
import { parseAiJson } from '../../shared/utils/json.util';

export interface QuestionCounts {
  codingCount: number;
  theoryCount: number;
  totalCount: number;
}

@Injectable()
export class AiGeneratorService {
  private readonly logger = new Logger(AiGeneratorService.name);
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly aiClient: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.geminiApiKey', '');
    this.modelName = this.configService.get<string>('ai.model', 'gemini-2.5-flash');

    if (this.apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: this.apiKey });
        this.logger.log(`Initialized Google AI Studio Gemini client with model: ${this.modelName}`);
      } catch (err) {
        this.logger.warn(`Failed to initialize GoogleGenAI client: ${getErrorMessage(err)}`);
      }
    }
  }

  /**
   * Generates tailored interview questions based on raw extracted resume text and interview configuration.
   * For Technical interviews, it structures questions into two sections:
   * 1. Section 1: Theory Questions (Resume & Technical Architecture)
   * 2. Section 2: Live Hands-on Coding Challenges (Algorithms & Data Structures in IDE)
   */
  async generateQuestions(params: {
    rawResumeText: string;
    targetRole: string;
    seniorityLevel: string;
    difficulty: string;
    interviewType: string;
    questionCount?: number;
    targetDurationMin?: number;
  }): Promise<SessionQuestion[]> {
    const isTechnical = params.interviewType.toLowerCase().includes('tech');
    const counts = this.computeQuestionCounts(params.targetDurationMin, isTechnical);

    this.logger.log(
      `🎯 [Question Breakdown] Duration: ${params.targetDurationMin || 30} min | Technical: ${isTechnical} | Theory Questions: ${counts.theoryCount} | Coding Challenges: ${counts.codingCount} | Total: ${counts.totalCount}`,
    );

    if (!this.apiKey) {
      throw new Error(
        '⚠️ GEMINI_API_KEY is not configured in backend/.env. Please configure GEMINI_API_KEY to test AI generation directly.',
      );
    }

    this.logger.log(`🤖 [Direct AI Call] Calling Google Gemini (${this.modelName}) to generate questions...`);
    const geminiQuestions = await this.generateWithGemini(params, counts);
    this.logger.log(`🤖 [Google Gemini AI] Successfully generated ${geminiQuestions.length} tailored questions using model "${this.modelName}"`);
    return geminiQuestions;
  }

  /**
   * Detects whether the resume mentions coding-related experience.
   */
  private hasCodingExperience(rawResumeText: string): boolean {
    if (!rawResumeText) return false;

    const codingKeywords = [
      'javascript', 'typescript', 'python', 'java', 'golang', ' go ', 'c++', 'c#', 'ruby', 'php',
      'kotlin', 'swift', 'rust', 'scala', 'sql', 'nosql', 'node', 'react', 'angular', 'vue',
      'next.js', 'express', 'django', 'flask', 'spring', '.net', 'laravel', 'rails',
      'developer', 'engineer', 'programming', 'coding', 'software', 'backend', 'frontend',
      'full stack', 'full-stack', 'devops', 'data structures', 'algorithms', 'api',
    ];

    const haystack = ` ${rawResumeText.toLowerCase().replace(/\s+/g, ' ')} `;
    return codingKeywords.some((kw) => haystack.includes(kw));
  }

  /**
   * Maps interview duration to the required question counts:
   * - 15 min: 2 Coding + 2 Theory (Total 4)
   * - 30 min: 4 Coding + 3 Theory (Total 7)
   * - 45 min: 6 Coding + 4 Theory (Total 10)
   * - 60 min: 8 Coding + 4 Theory (Total 12)
   */
  public computeQuestionCounts(targetDurationMin?: number, isTechnical = true): QuestionCounts {
    const duration = Number(targetDurationMin) || 30;

    if (!isTechnical) {
      const nonTechMap: Record<number, number> = { 15: 4, 30: 6, 45: 8, 60: 10 };
      const total = nonTechMap[duration] || 6;
      return { codingCount: 0, theoryCount: total, totalCount: total };
    }

    // Technical Interview Mapping:
    const codingMap: Record<number, number> = { 15: 2, 30: 4, 45: 6, 60: 8 };
    const theoryMap: Record<number, number> = { 15: 2, 30: 3, 45: 4, 60: 4 };

    const codingCount = codingMap[duration] ?? (duration <= 20 ? 2 : duration <= 35 ? 4 : duration <= 50 ? 6 : 8);
    const theoryCount = theoryMap[duration] ?? (duration <= 20 ? 2 : duration <= 35 ? 3 : 4);

    return {
      codingCount,
      theoryCount,
      totalCount: codingCount + theoryCount,
    };
  }

  private async generateWithGemini(
    params: {
      rawResumeText: string;
      targetRole: string;
      seniorityLevel: string;
      difficulty: string;
      interviewType: string;
    },
    counts: QuestionCounts,
  ): Promise<SessionQuestion[]> {
    const { theoryCount, codingCount, totalCount } = counts;
    const isTechnical = params.interviewType.toLowerCase().includes('tech');

    const prompt = `
You are an elite principal software architect and bar-raising technical hiring manager conducting a ${params.seniorityLevel} level ${params.interviewType} interview for the role of "${params.targetRole}" (Difficulty: ${params.difficulty}).

Candidate Resume Extract:
"""
${params.rawResumeText.slice(0, 8000)}
"""

JSON-SAFETY REQUIREMENT (CRITICAL):
- All code strings ("starterCode", "idealSolutionCode", "testCases") MUST be single-line escaped JSON strings — escape every quote (\\"), backslash (\\\\), regex backslash (\\\\s -> \\\\\\\\s), and use \\n for newlines.
- Never emit raw unescaped newlines, tabs, or quotes inside string values.

INTERVIEW STRUCTURE REQUIREMENTS:
Generate a JSON array of EXACTLY ${totalCount} questions structured into two sequential sections:

SECTION 1: TECHNICAL & RESUME THEORY QUESTIONS (Exactly ${theoryCount} questions)
- These questions must be directly derived from the technologies, libraries, past projects, system architectures, databases, and trade-offs explicitly mentioned in the candidate's resume.
- Focus areas: High-scale architecture, database query optimization & indexing, microservices resilience, framework internals, security, caching strategies, and incident RCA.
- For all Section 1 questions: set "section": "THEORY" and "isCoding": false.

SECTION 2: LIVE HANDS-ON CODING CHALLENGES (Exactly ${codingCount} questions)
- These questions must be practical coding/algorithm problems tailored to the candidate's primary programming language identified from their resume (e.g., JavaScript/TypeScript, Python, Java, Go, C++).
- Each challenge must include:
  * "section": "CODING"
  * "isCoding": true
  * "codingDetails" containing:
    - "language": the identified programming language (lowercase, e.g. "javascript", "typescript", "python")
    - "starterCode": clean function signature scaffold with JSDoc/type doc comments
    - "testCases": array of at least 3 test cases including boundary/edge cases (e.g. [{"input": "...", "expected": "..."}])
    - "idealSolutionCode": an optimal, well-commented reference solution with O(N) or best complexity
- Provide comprehensive "idealAnswer" and "expectedKeyPoints" for all questions.

Respond ONLY with a valid JSON array of objects adhering to this schema:
[
  // Theory Question Example (Section 1)
  {
    "id": "q1",
    "questionNumber": 1,
    "section": "THEORY",
    "isCoding": false,
    "category": "Technical Architecture",
    "difficulty": "${params.difficulty}",
    "question": "Based on your experience with [Specific Technology from Resume]...",
    "expectedKeyPoints": ["Key Point 1", "Key Point 2", "Key Point 3"],
    "idealAnswer": "Comprehensive technical answer explaining architecture, trade-offs, and scalability..."
  },
  // Coding Challenge Example (Section 2)
  {
    "id": "q${theoryCount + 1}",
    "questionNumber": ${theoryCount + 1},
    "section": "CODING",
    "isCoding": true,
    "category": "Data Structures & Algorithms",
    "difficulty": "${params.difficulty}",
    "question": "Implement a function that solves [Specific Algorithmic/Practical Problem]...",
    "codingDetails": {
      "language": "javascript",
      "starterCode": "/**\\n * @param {any} input\\n * @return {any}\\n */\\nfunction solution(input) {\\n  // Your code here\\n}\\n",
      "testCases": [
        { "input": "[1, 2, 3]", "expected": "6" },
        { "input": "[]", "expected": "0" },
        { "input": "[-1, 5, 2]", "expected": "6" }
      ],
      "idealSolutionCode": "function solution(input) {\\n  if (!Array.isArray(input) || input.length === 0) return 0;\\n  return input.reduce((a, b) => a + b, 0);\\n}"
    },
    "expectedKeyPoints": ["Optimal Time & Space Complexity", "Handles edge cases (empty, null, negative values)", "Clean idiomatic code"],
    "idealAnswer": "Optimal approach analysis, time and space complexity breakdown O(N), and edge case handling."
  }
]
`;

    let rawResponseText = '';

    if (this.aiClient) {
      const response = await this.aiClient.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });
      rawResponseText = response.text || '';
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const res = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      rawResponseText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const cleanJson = rawResponseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = parseAiJson(cleanJson);
    const questionsArray: any[] = Array.isArray(parsed) ? parsed : parsed.questions || [];

    return questionsArray.map((q: any, idx: number) => {
      const isCoding = Boolean(q.isCoding || q.section === 'CODING');
      const section: 'THEORY' | 'CODING' = isCoding ? 'CODING' : 'THEORY';

      return {
        id: `q_${idx + 1}`,
        questionNumber: idx + 1,
        question: q.question,
        section,
        category: q.category || (isCoding ? 'Data Structures & Algorithms' : params.interviewType),
        difficulty: q.difficulty || params.difficulty,
        expectedKeyPoints: q.expectedKeyPoints || [],
        idealAnswer: q.idealAnswer || 'An ideal response addresses core architecture, scalability bottlenecks, trade-offs, and measurable production impact.',
        source: 'GOOGLE_GEMINI_AI' as const,
        model: this.modelName,
        isFallback: false,
        isCoding,
        codingDetails: isCoding
          ? q.codingDetails || {
              language: 'javascript',
              starterCode: 'function solution() {\n  // Write your code here\n}',
              testCases: [
                { input: 'input1', expected: 'output1' },
                { input: 'input2', expected: 'output2' },
              ],
              idealSolutionCode: q.idealAnswer,
            }
          : undefined,
      };
    });
  }

  /**
   * Evaluates a candidate's answer strictly using Google AI Studio Gemini
   */
  async evaluateAnswer(params: {
    question: string;
    answer: string;
    expectedKeyPoints?: string[];
    idealAnswer?: string;
  }): Promise<{ score: number; feedback: string }> {
    const rawAnswer = (params.answer || '').trim();

    // Strict check: If skipped or empty or too short, score is 0
    if (!rawAnswer || rawAnswer.includes('[Skipped') || rawAnswer.length < 10) {
      return {
        score: 0,
        feedback: 'This question was skipped without an answer. Review the recommended ideal answer below to learn the best approach and prepare for your next interview.',
      };
    }

    if (!this.apiKey) {
      throw new Error(
        '⚠️ GEMINI_API_KEY is not configured in backend/.env. Please configure GEMINI_API_KEY to test AI answer evaluation directly.',
      );
    }

    const isCodeSubmission =
      rawAnswer.includes('```') ||
      rawAnswer.includes('function') ||
      rawAnswer.includes('def ') ||
      rawAnswer.includes('class ') ||
      rawAnswer.includes('=>') ||
      rawAnswer.includes('return ');

    const prompt = `
You are an uncompromising, strict senior technical interview bar-raiser evaluating a candidate's ${isCodeSubmission ? 'code implementation & problem-solving approach' : 'answer'}.

Question / Problem: "${params.question}"
Expected Key Points: ${JSON.stringify(params.expectedKeyPoints || [])}
Reference Ideal Answer: "${params.idealAnswer || 'Comprehensive architectural or algorithmic response'}"

Candidate Submission:
"""
${rawAnswer}
"""

CRITICAL EVALUATION RULES (STRICT ACCURACY CHECK):
1. ACCURACY COMES FIRST: If the candidate's answer is factually incorrect, wrong, nonsensical, irrelevant, or claims something false, you MUST assign a score between 0 and 20. DO NOT give credit for confident tone, long text, or fluff if the technical concept is wrong.
2. If the candidate answers an entirely different question or provides filler/gibberish, score: 0 to 10.
3. If the candidate provides a partially correct answer but has fundamental misconceptions or missing core points, score: 20 to 45.
4. If working but sub-optimal (e.g. brute force, missing edge cases, lacks architectural depth), score: 50 to 70.
5. If clean, technically accurate, and addresses expected key points, score: 71 to 85.
6. Only exceptional, optimal, production-grade solutions with trade-offs deserve 86 to 100.
${isCodeSubmission ? '7. For code submissions: Broken syntax, non-compiling code, or fundamentally wrong algorithms must be scored <= 20. Working code with missing edge cases: 40-60.' : ''}

In your feedback:
- Explicitly state whether the answer was correct, partially correct, or incorrect.
- Clearly identify the specific misconceptions, errors, or missing points compared to the ideal solution (2-3 concise sentences).

Respond ONLY in valid JSON format:
{"score": 15, "feedback": "Incorrect. The explanation confuses X with Y..."}
`;
    let rawResponseText = '';

    if (this.aiClient) {
      const response = await this.aiClient.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      rawResponseText = response.text || '';
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const res = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      rawResponseText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const cleanJson = rawResponseText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = parseAiJson<{ score?: number; feedback?: string }>(cleanJson);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      feedback: parsed.feedback || 'Answer evaluated based on technical depth and key criteria.',
    };
  }

  /**
   * Calculates overall session evaluation summary strictly based on real question performance
   */
  calculateFinalEvaluation(questions: SessionQuestion[]): SessionEvaluation {
    const scoredQuestions = questions.filter((q) => typeof q.score === 'number');

    if (scoredQuestions.length === 0) {
      return {
        overallScore: 0,
        subScores: { technical: 0, communication: 0, problemSolving: 0, confidence: 0 },
        strengths: ['No answers were submitted during this session.'],
        improvements: ['Attempt answering the interview questions to receive detailed AI evaluation and scoring.'],
        recommendations: ['Review the provided ideal answers for each question to practice your response delivery.'],
      };
    }

    const totalScoreSum = scoredQuestions.reduce((acc, q) => acc + (q.score || 0), 0);
    const avgScore = Math.round(totalScoreSum / scoredQuestions.length);

    // Compute category-specific subscores
    const codingQuestions = scoredQuestions.filter((q) => q.isCoding || q.section === 'CODING');
    const theoryQuestions = scoredQuestions.filter((q) => !q.isCoding && q.section !== 'CODING');

    const codingAvg = codingQuestions.length
      ? Math.round(codingQuestions.reduce((acc, q) => acc + (q.score || 0), 0) / codingQuestions.length)
      : avgScore;

    const theoryAvg = theoryQuestions.length
      ? Math.round(theoryQuestions.reduce((acc, q) => acc + (q.score || 0), 0) / theoryQuestions.length)
      : avgScore;

    const technicalScore = Math.min(100, Math.max(0, theoryAvg));
    const problemSolvingScore = Math.min(100, Math.max(0, codingAvg));
    const communicationScore = Math.min(100, Math.max(0, Math.round(avgScore * 0.95)));
    const confidenceScore = Math.min(100, Math.max(0, Math.round(avgScore * 0.98)));

    // Derive dynamic strengths from high-scoring questions
    const highScorers = scoredQuestions.filter((q) => (q.score || 0) >= 70);
    const lowScorers = scoredQuestions.filter((q) => (q.score || 0) < 60);

    const strengths: string[] = [];
    if (highScorers.length > 0) {
      highScorers.slice(0, 3).forEach((q) => {
        strengths.push(`Solid understanding demonstrated in ${q.category || 'Technical Area'}: successfully articulated core concepts.`);
      });
    } else {
      strengths.push('Demonstrated persistence by attempting questions across multiple technical topic areas.');
    }

    // Derive dynamic improvements from low-scoring questions
    const improvements: string[] = [];
    if (lowScorers.length > 0) {
      lowScorers.slice(0, 3).forEach((q) => {
        improvements.push(`Review ${q.category || 'topic'} constraints and revise core principles for "${q.question.slice(0, 70)}..."`);
      });
    } else {
      improvements.push('Deepen coverage of edge cases, quantifiable SLAs (p99 latency, throughput), and production failure modes.');
    }

    // Derive dynamic study recommendations
    const recommendations: string[] = [];
    if (lowScorers.length > 0) {
      lowScorers.slice(0, 3).forEach((q) => {
        if (q.category && !recommendations.includes(q.category)) {
          recommendations.push(`Deep dive into ${q.category} architecture and standard patterns`);
        }
      });
    }
    if (recommendations.length === 0) {
      recommendations.push('High-scale distributed systems and resiliency patterns');
      recommendations.push('Database query optimization and index design');
    }

    return {
      overallScore: avgScore,
      subScores: {
        technical: technicalScore,
        communication: communicationScore,
        problemSolving: problemSolvingScore,
        confidence: confidenceScore,
      },
      strengths,
      improvements,
      recommendations,
    };
  }
}
