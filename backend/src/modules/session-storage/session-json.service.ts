import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getErrorMessage } from '../../shared/utils/error.util';

export interface SessionResumeData {
  originalFileName: string;
  mimeType: string;
  storedFilePath: string;
  totalPages?: number;
  imagePaths?: string[];
  pages?: Array<{
    pageNo: number;
    fileName?: string;
    rawText: string;
    confidence?: number;
  }>;
  fullExtractedText?: string;
}

export interface SessionQuestion {
  id: string;
  questionNumber: number;
  question: string;
  category: string; // Technical, Architecture, Behavioral, ProblemSolving, Coding & Algorithms
  difficulty: string;
  expectedKeyPoints?: string[];
  idealAnswer?: string;
  userAnswer?: string;
  aiFeedback?: string;
  score?: number;
  missingKeyPoints?: string[];
  answeredAt?: string;
  source?: 'GOOGLE_GEMINI_AI' | 'LOCAL_FALLBACK';
  model?: string;
  isFallback?: boolean;
  isCoding?: boolean;
  section?: 'THEORY' | 'CODING';
  codingDetails?: {
    language?: string;
    starterCode?: string;
    testCases?: Array<{
      input: string;
      expected: string;
      actual?: string;
      passed?: boolean;
    }>;
    idealSolutionCode?: string;
  };
  code?: string;
  language?: string;
}

export interface SessionEvaluation {
  overallScore?: number;
  subScores?: {
    technical?: number;
    communication?: number;
    problemSolving?: number;
    confidence?: number;
  };
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
}

export interface SessionDocument {
  sessionId: string;
  title: string;
  status: string;
  metadata: {
    targetRole: string;
    seniorityLevel: string;
    difficulty: string;
    interviewType: string;
    targetDurationMinutes: number;
    createdAt: string;
    updatedAt: string;
  };
  resume: SessionResumeData;
  generatedQuestions: SessionQuestion[];
  evaluation: SessionEvaluation;
  generationInfo?: {
    source: 'GOOGLE_GEMINI_AI' | 'LOCAL_FALLBACK';
    model?: string;
    isFallback: boolean;
    fallbackReason?: string;
    generatedAt: string;
  };
  pipelineLogs?: Array<{
    step: string;
    timestamp: string;
    status: 'pending' | 'success' | 'failed';
    message?: string;
  }>;
}

@Injectable()
export class SessionJsonService {
  private readonly logger = new Logger(SessionJsonService.name);
  private readonly sessionsDir = path.join(process.cwd(), 'storage', 'sessions');

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (err) {
      this.logger.error(`Failed to create sessions directory: ${getErrorMessage(err)}`);
    }
  }

  getFilePath(sessionId: string): string {
    return path.join(this.sessionsDir, `${sessionId}.json`);
  }

  getRelativePath(sessionId: string): string {
    return path.join('storage', 'sessions', `${sessionId}.json`);
  }

  async initializeSessionFile(initialData: {
    sessionId: string;
    title?: string;
    targetRole: string;
    seniorityLevel: string;
    difficulty: string;
    interviewType: string;
    targetDurationMin: number;
    originalFileName: string;
    mimeType: string;
    storedFilePath: string;
  }): Promise<{ filePath: string; relativePath: string; data: SessionDocument }> {
    await this.ensureDirectoryExists();

    const filePath = this.getFilePath(initialData.sessionId);
    const relativePath = this.getRelativePath(initialData.sessionId);
    const now = new Date().toISOString();

    const sessionDoc: SessionDocument = {
      sessionId: initialData.sessionId,
      title:
        initialData.title ||
        `${initialData.seniorityLevel} ${initialData.interviewType} Interview - ${initialData.targetRole}`,
      status: 'PENDING',
      metadata: {
        targetRole: initialData.targetRole,
        seniorityLevel: initialData.seniorityLevel,
        difficulty: initialData.difficulty,
        interviewType: initialData.interviewType,
        targetDurationMinutes: initialData.targetDurationMin,
        createdAt: now,
        updatedAt: now,
      },
      resume: {
        originalFileName: initialData.originalFileName,
        mimeType: initialData.mimeType,
        storedFilePath: initialData.storedFilePath,
        pages: [],
        fullExtractedText: '',
      },
      generatedQuestions: [],
      evaluation: {
        strengths: [],
        improvements: [],
        recommendations: [],
      },
      pipelineLogs: [
        {
          step: 'SESSION_INITIALIZED',
          timestamp: now,
          status: 'success',
          message: 'Session record and JSON document initialized',
        },
      ],
    };

    await fs.writeFile(filePath, JSON.stringify(sessionDoc, null, 2), 'utf-8');
    this.logger.log(`Initialized session JSON file at: ${filePath}`);

    return { filePath, relativePath, data: sessionDoc };
  }

  async readSession(sessionId: string): Promise<SessionDocument> {
    const filePath = this.getFilePath(sessionId);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as SessionDocument;
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new NotFoundException(`Session JSON file for ${sessionId} not found.`);
      }
      throw err;
    }
  }

  async updateSession(
    sessionId: string,
    updater: (doc: SessionDocument) => SessionDocument | Promise<SessionDocument>,
  ): Promise<SessionDocument> {
    const doc = await this.readSession(sessionId);
    const updated = await updater(doc);
    updated.metadata.updatedAt = new Date().toISOString();

    const filePath = this.getFilePath(sessionId);
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  async logPipelineStep(
    sessionId: string,
    step: string,
    status: 'pending' | 'success' | 'failed',
    message?: string,
  ): Promise<SessionDocument> {
    return this.updateSession(sessionId, (doc) => {
      if (!doc.pipelineLogs) doc.pipelineLogs = [];
      doc.pipelineLogs.push({
        step,
        timestamp: new Date().toISOString(),
        status,
        message,
      });
      return doc;
    });
  }
}
