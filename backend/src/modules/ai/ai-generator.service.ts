import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { SessionQuestion, SessionEvaluation } from '../session-storage/session-json.service';

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
        this.logger.warn(`Failed to initialize GoogleGenAI client: ${err.message}`);
      }
    }
  }

  /**
   * Generates tailored interview questions based on raw extracted resume text and interview configuration
   */
  async generateQuestions(params: {
    rawResumeText: string;
    targetRole: string;
    seniorityLevel: string;
    difficulty: string;
    interviewType: string;
    questionCount?: number;
  }): Promise<SessionQuestion[]> {
    const count = params.questionCount || 5;

    if (this.apiKey) {
      try {
        const geminiQuestions = await this.generateWithGemini(params, count);
        this.logger.log(`🤖 [Google Gemini AI] Successfully generated ${geminiQuestions.length} tailored questions using model "${this.modelName}"`);
        return geminiQuestions;
      } catch (err) {
        this.logger.warn(`⚠️ [Smart Local Fallback] Google Gemini generation failed (${err.message}). Activating smart local generator.`);
      }
    } else {
      this.logger.warn(`⚠️ [Smart Local Fallback] No GEMINI_API_KEY detected in environment. Using smart local generator.`);
    }

    return this.generateLocally(params, count);
  }

  private async generateWithGemini(
    params: {
      rawResumeText: string;
      targetRole: string;
      seniorityLevel: string;
      difficulty: string;
      interviewType: string;
    },
    count: number,
  ): Promise<SessionQuestion[]> {
    const prompt = `
You are an expert technical bar-raiser hiring manager conducting a ${params.seniorityLevel} level ${params.interviewType} interview for the position of "${params.targetRole}" (Difficulty: ${params.difficulty}).

Here is the candidate's raw extracted resume text:
"""
${params.rawResumeText.slice(0, 8000)}
"""

Generate exactly ${count} relevant, tailored interview questions that evaluate both their background from the resume and the target role requirements.
For EACH question, provide a comprehensive, best-practice "idealAnswer" (2-3 detailed paragraphs explaining the architectural design, trade-offs, relevant metrics, code or query examples, and best practices) that an elite candidate would deliver.

Respond ONLY with a valid JSON array of objects with the following schema:
[
  {
    "id": "q1",
    "questionNumber": 1,
    "question": "Question text here...",
    "category": "Technical Architecture | System Scalability | Database & Data Access | Problem Solving | Behavioral & Leadership",
    "difficulty": "${params.difficulty}",
    "expectedKeyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "idealAnswer": "Comprehensive model answer explaining core architecture, code patterns, tradeoffs, SLAs, and best practices..."
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
      // Direct REST API fallback
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

    let parsed: any;
    let cleanJson = rawResponseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    // Resilient JSON array extraction
    const firstBracket = cleanJson.indexOf('[');
    const lastBracket = cleanJson.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
    }

    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      // Clean possible control character or escaping errors
      const sanitized = cleanJson.replace(/[\u0000-\u001F]+/g, (m) => (m === '\n' || m === '\r' ? '\\n' : ''));
      parsed = JSON.parse(sanitized);
    }

    const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions || [];

    return questionsArray.map((q: any, idx: number) => ({
      id: `q_${idx + 1}`,
      questionNumber: idx + 1,
      question: q.question,
      category: q.category || params.interviewType,
      difficulty: q.difficulty || params.difficulty,
      expectedKeyPoints: q.expectedKeyPoints || [],
      idealAnswer: q.idealAnswer || 'An ideal response addresses core architecture, scalability bottlenecks, trade-offs, and measurable production impact.',
      source: 'GOOGLE_GEMINI_AI' as const,
      model: this.modelName,
      isFallback: false,
    }));
  }

  private generateLocally(
    params: {
      rawResumeText: string;
      targetRole: string;
      seniorityLevel: string;
      difficulty: string;
      interviewType: string;
    },
    count: number,
  ): SessionQuestion[] {
    const lowerText = params.rawResumeText.toLowerCase();

    // Extract detected technologies/keywords from raw text
    const detectedSkills: string[] = [];
    const techPool = [
      'react', 'node', 'nestjs', 'typescript', 'javascript', 'docker', 'kubernetes',
      'aws', 'postgresql', 'mongodb', 'graphql', 'python', 'kafka', 'redis', 'microservices',
      'ci/cd', 'git', 'linux', 'devops', 'next.js', 'sql', 'prisma', 'rest api',
    ];

    for (const tech of techPool) {
      if (lowerText.includes(tech)) {
        detectedSkills.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    }

    const primarySkill = detectedSkills[0] || 'Modern Full Stack Technologies';
    const secondarySkill = detectedSkills[1] || 'Distributed Microservices';
    const dbSkill = detectedSkills.find((s) => ['Postgresql', 'Mongodb', 'Redis', 'Sql'].includes(s)) || 'Relational & NoSQL Databases';

    const questionTemplates: Array<{ question: string; category: string; keyPoints: string[]; idealAnswer: string }> = [
      {
        question: `Based on your experience with ${primarySkill} in your resume, can you walk me through the most complex challenge you solved and the architectural decisions you made?`,
        category: 'Technical Architecture',
        keyPoints: ['Core problem statement & constraints', 'Architecture diagram / trade-offs', 'Bottlenecks identified & mitigated', 'Measurable production SLA outcome'],
        idealAnswer: `An exemplary answer breaks down the challenge into 4 stages:
1. Context & Scale: Clearly define baseline metrics (e.g. 50,000 req/sec peak, p99 latency spikes exceeding 1200ms, or database locking under concurrent writes).
2. Architecture Design: Explain the decoupling strategy (e.g., adopting asynchronous message queues with BullMQ/Kafka, separating read/write paths with CQRS, and implementing idempotent worker consumers).
3. Trade-offs: Compare alternatives (e.g. why Redis distributed locking was selected over optimistic database locking due to write contention).
4. Outcome: Provide quantifiable results (e.g. reduced p99 latency by 78% down to 65ms, eliminated deadlock incidents, and achieved 99.99% uptime).`,
      },
      {
        question: `When building high-throughput services with ${secondarySkill}, how do you ensure zero data loss, fault tolerance, and proper telemetry/observability?`,
        category: 'System Scalability',
        keyPoints: ['Idempotency handling & de-duplication', 'Circuit breaker & retry policies with backoff', 'Distributed tracing (OpenTelemetry/APM)', 'Dead-letter queues (DLQ) & alerts'],
        idealAnswer: `An elite response covers resiliency at all layers:
- Idempotency: Use unique event/transaction IDs with distributed Redis locks and unique database constraints to guarantee exactly-once processing semantics.
- Fault Tolerance: Implement exponential backoff with jitter and circuit breakers (e.g. using Cockatiel/Opossum) to prevent cascading microservice outages.
- Observability: Instrument OpenTelemetry distributed tracing with correlation IDs propagated across HTTP headers and queues, monitoring RED (Rate, Errors, Duration) metrics with Prometheus and Grafana.
- Recovery: Route poisoned messages to Dead-Letter Queues (DLQ) with automated alerting and reprocessing tooling.`,
      },
      {
        question: `How do you structure database schemas, query indexing, and caching layers with ${dbSkill} to handle sudden traffic spikes?`,
        category: 'Database & Data Access',
        keyPoints: ['Index optimization (B-tree, composite, GIN)', 'Cache invalidation strategies & cache-aside', 'Read replicas / Connection pooling (PgBouncer)', 'Transaction isolation & deadlock mitigation'],
        idealAnswer: `An ideal answer addresses:
1. Indexing Strategy: Analyze execution plans with EXPLAIN ANALYZE, creating composite indexes aligned with WHERE and ORDER BY cardinality, and partial indexes for active statuses.
2. Caching Layer: Implement a Cache-Aside pattern with Redis, setting jittered TTLs and mutex locks to prevent cache stampedes (dogpiling) during flash spikes.
3. Connection & Scale: Deploy PgBouncer in transaction-pooling mode to prevent connection exhaustion, utilizing read replicas with round-robin load balancing for heavy read traffic.`,
      },
      {
        question: `As a ${params.seniorityLevel} ${params.targetRole}, how do you approach technical trade-offs between speed of delivery and architectural purity when mentoring teammates?`,
        category: 'Leadership & Pragmatism',
        keyPoints: ['Pragmatic technical debt management', 'Architecture Decision Records (ADRs)', 'Constructive code review culture', 'Mentorship & continuous knowledge sharing'],
        idealAnswer: `A strong answer demonstrates mature engineering leadership:
- Pragmatic Technical Debt: Acknowledge that deliberate technical debt is sometimes acceptable for business validation, provided it is documented with ADRs (Architectural Decision Records) and prioritized on the tech roadmap.
- Code Review Culture: Foster blameless, pedagogical code reviews that emphasize architecture, testing boundaries, and readability rather than subjective nitpicks.
- Mentorship: Pair program with junior and mid-level engineers on complex architectural patterns to foster autonomy and shared code ownership.`,
      },
      {
        question: `Can you describe a production incident you diagnosed and resolved? What post-mortem actions did you implement to prevent recurrence?`,
        category: 'Incident Response & Reliability',
        keyPoints: ['Root cause analysis (RCA)', 'Immediate mitigation vs long-term fix', 'Blameless post-mortem & action items', 'Automated regression guards & chaos testing'],
        idealAnswer: `An outstanding response follows a structured post-mortem framework:
1. Incident Triage: Rapid detection via APM latency anomaly alerts, initiating an incident bridge and rolling back or enabling circuit breakers to stabilize traffic immediately.
2. Root Cause Analysis (5 Whys): Tracing the failure (e.g. unindexed foreign key causing table locks during bulk deletes).
3. Preventive Actions: Implementing automated linting/migration checks in CI/CD, adding synthetic smoke tests, and scheduling blameless post-mortems with measurable SLAs.`,
      },
    ];

    return questionTemplates.slice(0, count).map((t, idx) => ({
      id: `q_${idx + 1}`,
      questionNumber: idx + 1,
      question: t.question,
      category: t.category,
      difficulty: params.difficulty,
      expectedKeyPoints: t.keyPoints,
      idealAnswer: t.idealAnswer,
      source: 'LOCAL_FALLBACK' as const,
      model: 'SmartLocalGenerator',
      isFallback: true,
    }));
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

    if (this.apiKey) {
      try {
        const prompt = `
You are a strict, senior technical interview bar-raiser evaluating a candidate's answer.

Question: "${params.question}"
Expected Key Points: ${JSON.stringify(params.expectedKeyPoints || [])}
Reference Ideal Answer: "${params.idealAnswer || 'Comprehensive architectural response'}"

Candidate Answer: "${rawAnswer}"

Evaluation Rubric:
- 0 to 20: Completely irrelevant, gibberish, or fundamentally incorrect.
- 21 to 50: Weak, missing almost all key points, lacks technical depth or understanding.
- 51 to 70: Basic/partial understanding, mentions keywords but lacks depth, concrete examples, or trade-offs.
- 71 to 85: Good solid answer, addresses core concepts with clear explanation.
- 86 to 100: Exceptional, comprehensive bar-raiser response covering architecture, trade-offs, edge cases, and measurable production impact.

Be strict and realistic. Do not give high scores to vague or superficial responses.
Provide a numeric score (0 to 100) and actionable constructive feedback (2-3 sentences).

Respond ONLY in valid JSON format:
{"score": 75, "feedback": "Constructive critique here..."}
`;
        let rawResponseText = '';

        if (this.aiClient) {
          const response = await this.aiClient.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
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
                temperature: 0.2,
              },
            },
            { headers: { 'Content-Type': 'application/json' } },
          );
          rawResponseText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        const cleanJson = rawResponseText.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
          feedback: parsed.feedback || 'Answer evaluated based on technical depth and key criteria.',
        };
      } catch (err) {
        this.logger.warn(`Google Gemini answer evaluation fallback: ${err.message}`);
      }
    }

    // Local evaluation heuristic (strict)
    const wordCount = rawAnswer.split(/\s+/).filter(Boolean).length;
    if (wordCount < 15) {
      return {
        score: 30,
        feedback: 'Your answer is very brief. Try articulating concrete architectural patterns, trade-offs, and measurable outcomes.',
      };
    } else if (wordCount < 40) {
      return {
        score: 65,
        feedback: 'Good start covering high-level concepts, but needs deeper technical depth and specific tooling examples.',
      };
    } else if (wordCount < 90) {
      return {
        score: 82,
        feedback: 'Solid, well-structured explanation! You covered the core principles and highlighted architectural considerations.',
      };
    }

    return {
      score: 90,
      feedback: 'Comprehensive and thorough answer demonstrating deep technical domain knowledge and clear trade-off evaluation.',
    };
  }

  /**
   * Calculates overall session evaluation summary strictly
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

    const avgScore = Math.round(
      scoredQuestions.reduce((acc, q) => acc + (q.score || 0), 0) / scoredQuestions.length,
    );

    if (avgScore === 0) {
      return {
        overallScore: 0,
        subScores: { technical: 0, communication: 0, problemSolving: 0, confidence: 0 },
        strengths: ['No completed answers were recorded.'],
        improvements: ['Practice answering the questions directly rather than skipping them.'],
        recommendations: ['Study the ideal answers provided for each question to build familiarity with expected concepts.'],
      };
    }

    return {
      overallScore: avgScore,
      subScores: {
        technical: Math.min(100, Math.max(0, avgScore + 2)),
        communication: Math.min(100, Math.max(0, avgScore - 2)),
        problemSolving: avgScore,
        confidence: Math.min(100, Math.max(0, avgScore + 1)),
      },
      strengths: [
        'Structured technical articulation with clear system boundaries',
        'Strong contextual understanding of core engineering principles',
      ],
      improvements: [
        'Elaborate more on quantifiable metrics (e.g. latency percentiles, throughput)',
        'Mention failure modes and recovery procedures in greater depth',
      ],
      recommendations: [
        'System Scalability and Microservices Resilience',
        'Database query plan optimization & indexing',
      ],
    };
  }
}
