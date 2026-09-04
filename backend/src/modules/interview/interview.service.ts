import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, StreamableFile } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { SessionJsonService, SessionDocument } from '../session-storage/session-json.service';
import { AiGeneratorService } from '../ai/ai-generator.service';
import { INTERVIEW_RESUME_QUEUE, JOB_PROCESS_RESUME, ResumePipelineJobData } from '../queue/queue.constants';
import { CreateSessionDto, CreateSampleSessionDto, ReuseResumeDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { getErrorMessage } from '../../shared/utils/error.util';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'storage', 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionJsonService: SessionJsonService,
    private readonly aiGeneratorService: AiGeneratorService,
    @InjectQueue(INTERVIEW_RESUME_QUEUE) private readonly resumeQueue: Queue<ResumePipelineJobData>,
  ) {
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (err) {
      this.logger.error(`Failed to create uploads directory: ${getErrorMessage(err)}`);
    }
  }

  /**
   * Creates a new interview session record and spawns the BullMQ resume ingestion pipeline
   */
  async createSessionWithUpload(file: Express.Multer.File, dto: CreateSessionDto, userId?: string) {
    if (!file) {
      throw new BadRequestException('A resume file (.pdf, .doc, .docx, .png, .jpg) is required');
    }

    await this.ensureUploadsDir();

    const sessionId = uuidv4();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storedFileName = `${sessionId}_${safeOriginalName}`;
    const storedFilePath = path.join(this.uploadsDir, storedFileName);

    // Save uploaded resume buffer to storage/uploads/
    await fs.writeFile(storedFilePath, file.buffer);

    const relativeStoredFilePath = path.join('storage', 'uploads', storedFileName);

    // 1. Initialize per-session JSON file in storage/sessions/<sessionId>.json
    const { relativePath: sessionJsonPath, data: initialJsonDoc } =
      await this.sessionJsonService.initializeSessionFile({
        sessionId,
        title: dto.title,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        storedFilePath: relativeStoredFilePath,
      });

    // 2. Insert record in PostgreSQL via Prisma with userId association
    const sessionRecord = await this.prisma.interviewSession.create({
      data: {
        id: sessionId,
        title: dto.title || `${dto.seniorityLevel || 'Senior'} ${dto.interviewType || 'Technical'} Interview - ${dto.targetRole}`,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        status: 'PENDING',
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        storedFilePath: relativeStoredFilePath,
        sessionJsonPath,
        userId: userId || null,
      },
    });

    // 3. Dispatch BullMQ background job for conversion -> OCR -> AI generation
    const job = await this.resumeQueue.add(
      JOB_PROCESS_RESUME,
      {
        sessionId,
        storedFilePath,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
      },
      {
        jobId: `job_${sessionId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { bullJobId: job.id?.toString() },
    });

    this.logger.log(`Created interview session ${sessionId} with BullMQ job ${job.id}`);

    return {
      session: sessionRecord,
      sessionData: initialJsonDoc,
      jobId: job.id,
      message: 'Resume upload received. Processing pipeline started in BullMQ background queue.',
    };
  }

  /**
   * Creates a new session reusing a previously uploaded resume
   */
  async createSessionWithExistingResume(dto: ReuseResumeDto, userId?: string) {
    const sourceSession = await this.prisma.interviewSession.findUnique({
      where: { id: dto.sourceSessionId },
    });

    if (!sourceSession) {
      throw new NotFoundException(`Source session ${dto.sourceSessionId} not found`);
    }

    if (userId && sourceSession.userId && sourceSession.userId !== userId) {
      throw new ForbiddenException('Cannot reuse a resume from another candidate');
    }

    const sessionId = uuidv4();
    const newStoredFileName = `${sessionId}_${sourceSession.originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const newStoredFilePath = path.join(this.uploadsDir, newStoredFileName);
    const oldAbsoluteFilePath = path.join(process.cwd(), sourceSession.storedFilePath);

    // Copy the existing resume file on disk
    try {
      if (fsSync.existsSync(oldAbsoluteFilePath)) {
        await fs.copyFile(oldAbsoluteFilePath, newStoredFilePath);
      }
    } catch (err) {
      this.logger.warn(`Could not copy physical file: ${getErrorMessage(err)}`);
    }

    const relativeStoredFilePath = path.join('storage', 'uploads', newStoredFileName);

    // 1. Initialize per-session JSON file
    const { relativePath: sessionJsonPath, data: initialDoc } =
      await this.sessionJsonService.initializeSessionFile({
        sessionId,
        title: dto.title || `${dto.seniorityLevel || 'Senior'} ${dto.interviewType || 'Technical'} Interview - ${dto.targetRole}`,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        originalFileName: sourceSession.originalFileName,
        mimeType: sourceSession.mimeType,
        storedFilePath: relativeStoredFilePath,
      });

    const hasPreExtracted = Boolean(sourceSession.rawExtractedText);

    // Create session record immediately in DB
    const sessionRecord = await this.prisma.interviewSession.create({
      data: {
        id: sessionId,
        title: initialDoc.title,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        status: hasPreExtracted ? 'GENERATING_QUESTIONS' : 'PENDING',
        originalFileName: sourceSession.originalFileName,
        mimeType: sourceSession.mimeType,
        storedFilePath: relativeStoredFilePath,
        sessionJsonPath,
        rawExtractedText: sourceSession.rawExtractedText || null,
        userId: userId || null,
      },
    });

    if (hasPreExtracted) {
      await this.sessionJsonService.logPipelineStep(
        sessionId,
        'DOCUMENT_CONVERSION_COMPLETED',
        'success',
        'Resume verified & page images retrieved from existing profile',
      );
      await this.sessionJsonService.logPipelineStep(
        sessionId,
        'OCR_EXTRACTION_COMPLETED',
        'success',
        `Retrieved ${sourceSession.rawExtractedText.length} characters of verified extracted text`,
      );
      await this.sessionJsonService.logPipelineStep(
        sessionId,
        'AI_QUESTION_GENERATION_STARTED',
        'pending',
        'Generating tailored interview questions based on extracted resume profile',
      );
    }

    // Dispatch BullMQ background job (fast-path skips conversion & OCR if pre-extracted)
    const job = await this.resumeQueue.add(
      JOB_PROCESS_RESUME,
      {
        sessionId,
        storedFilePath: newStoredFilePath,
        originalFileName: sourceSession.originalFileName,
        mimeType: sourceSession.mimeType,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        skipConversion: hasPreExtracted,
        preExtractedText: sourceSession.rawExtractedText || undefined,
      },
      {
        jobId: `job_${sessionId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { bullJobId: job.id?.toString() },
    });

    this.logger.log(`Created interview session ${sessionId} with BullMQ job ${job.id} (preExtracted: ${hasPreExtracted})`);

    return {
      session: sessionRecord,
      sessionData: initialDoc,
      jobId: job.id,
      message: 'New session created and queued for background AI question generation.',
    };
  }

  /**
   * Retrieves list of all unique previously uploaded resumes with metadata (scoped to user)
   */
  async getPreviouslyUploadedResumes(userId?: string) {
    if (!userId) {
      return [];
    }

    const sessions = await this.prisma.interviewSession.findMany({
      where: {
        userId,
        originalFileName: { not: '' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalFileName: true,
        mimeType: true,
        storedFilePath: true,
        rawExtractedText: true,
        targetRole: true,
        createdAt: true,
        userId: true,
      },
    });

    // Deduplicate by originalFileName (keeping the most recent)
    const seen = new Set<string>();
    const uniqueResumes = [];

    for (const s of sessions) {
      if (!seen.has(s.originalFileName)) {
        if (!s.storedFilePath) {
          continue;
        }

        // Check if physical file exists
        const absPath = path.join(process.cwd(), s.storedFilePath);
        let fileSize = 0;
        try {
          if (fsSync.existsSync(absPath)) {
            const stat = fsSync.statSync(absPath);
            fileSize = stat.size;
          } else {
            // Physical file not found on disk: skip so deleted/ghost resumes are not returned
            continue;
          }
        } catch (e) {
          continue;
        }

        seen.add(s.originalFileName);

        const snippet = s.rawExtractedText
          ? s.rawExtractedText.slice(0, 200).replace(/\s+/g, ' ').trim() + '...'
          : 'Extracted text processing...';

        uniqueResumes.push({
          sessionId: s.id,
          fileName: s.originalFileName,
          mimeType: s.mimeType,
          fileSize,
          uploadedAt: s.createdAt,
          targetRole: s.targetRole,
          textSnippet: snippet,
        });
      }
    }

    return uniqueResumes;
  }

  /**
   * Streams/serves the resume file for preview or download (strictly scoped to owner)
   */
  async getResumeFile(sessionId: string, userId?: string): Promise<{ fileStream: fsSync.ReadStream; mimeType: string; fileName: string }> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (userId && session.userId && session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this resume document');
    }

    const absPath = path.join(process.cwd(), session.storedFilePath);
    if (!fsSync.existsSync(absPath)) {
      throw new NotFoundException(`Resume file for session ${sessionId} not found on disk`);
    }

    const fileStream = fsSync.createReadStream(absPath);
    return {
      fileStream,
      mimeType: session.mimeType || 'application/pdf',
      fileName: session.originalFileName,
    };
  }

  /**
   * Creates a session using sample profile text (instant initialization with Google Gemini)
   */
  async createSampleSession(dto: CreateSampleSessionDto, userId?: string) {
    const sessionId = uuidv4();
    const resumeName = dto.sampleResumeName || 'Sample_Engineer_Resume.pdf';
    const resumeText =
      dto.sampleResumeText ||
      `Senior Full Stack Engineer with 7+ years of experience in React, TypeScript, Node.js, NestJS, PostgreSQL, Redis, Docker, and AWS microservices. Led migration of monolithic backend to event-driven architecture using BullMQ and Kafka. Designed distributed rate limiting, JWT token management, and sub-second database indexing strategies.`;

    const relativeStoredFilePath = `storage/uploads/${sessionId}_sample.txt`;

    const { relativePath: sessionJsonPath, data: initialDoc } =
      await this.sessionJsonService.initializeSessionFile({
        sessionId,
        title: dto.title || `${dto.seniorityLevel || 'Senior'} ${dto.interviewType || 'Technical'} Interview - ${dto.targetRole}`,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        originalFileName: resumeName,
        mimeType: 'text/plain',
        storedFilePath: relativeStoredFilePath,
      });

    // Generate questions via Google Gemini
    const questions = await this.aiGeneratorService.generateQuestions({
      rawResumeText: resumeText,
      targetRole: dto.targetRole,
      seniorityLevel: dto.seniorityLevel || 'Senior',
      difficulty: dto.difficulty || 'Medium',
      interviewType: dto.interviewType || 'Technical',
      questionCount: 5,
      targetDurationMin: dto.targetDurationMin || 30,
    });

    // Update Session JSON
    const updatedDoc = await this.sessionJsonService.updateSession(sessionId, (doc) => {
      doc.status = 'READY';
      doc.resume.fullExtractedText = resumeText;
      doc.resume.pages = [{ pageNo: 1, rawText: resumeText, confidence: 99.0 }];
      doc.generatedQuestions = questions;
      return doc;
    });

    // Save to Postgres with userId association
    const sessionRecord = await this.prisma.interviewSession.create({
      data: {
        id: sessionId,
        title: initialDoc.title,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel || 'Senior',
        difficulty: dto.difficulty || 'Medium',
        interviewType: dto.interviewType || 'Technical',
        targetDurationMin: dto.targetDurationMin || 30,
        status: 'READY',
        originalFileName: resumeName,
        mimeType: 'text/plain',
        storedFilePath: relativeStoredFilePath,
        sessionJsonPath,
        rawExtractedText: resumeText,
        userId: userId || null,
      },
    });

    return {
      session: sessionRecord,
      sessionData: updatedDoc,
      message: 'Sample session created and questions generated successfully via Google Gemini.',
    };
  }

  /**
   * Retrieves full session payload (scoped to user)
   */
  async getSessionById(sessionId: string, userId?: string) {
    const dbRecord = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbRecord) {
      throw new NotFoundException(`Interview session with ID ${sessionId} not found`);
    }

    if (userId && dbRecord.userId && dbRecord.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this interview session');
    }

    let jsonDocument: SessionDocument | null = null;
    try {
      jsonDocument = await this.sessionJsonService.readSession(sessionId);
    } catch (err) {
      this.logger.warn(`Could not read session JSON for ${sessionId}: ${getErrorMessage(err)}`);
    }

    return {
      ...dbRecord,
      sessionData: jsonDocument,
    };
  }

  /**
   * Returns session status and pipeline progress for polling
   */
  async getSessionStatus(sessionId: string, userId?: string) {
    const dbRecord = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        targetRole: true,
        seniorityLevel: true,
        errorMessage: true,
        bullJobId: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!dbRecord) {
      throw new NotFoundException(`Interview session with ID ${sessionId} not found`);
    }

    if (userId && dbRecord.userId && dbRecord.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this interview session status');
    }

    let logs = [];
    let questionsCount = 0;
    try {
      const jsonDoc = await this.sessionJsonService.readSession(sessionId);
      logs = jsonDoc.pipelineLogs || [];
      questionsCount = jsonDoc.generatedQuestions?.length || 0;
    } catch (e) {
      // ignore if not ready
    }

    return {
      ...dbRecord,
      questionsReady: questionsCount,
      logs,
    };
  }

  /**
   * Lists all interview sessions from the database (strictly filtered by logged-in user)
   */
  async getAllSessions(userId?: string) {
    if (!userId) {
      return [];
    }

    return this.prisma.interviewSession.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Evaluates a candidate's answer for a specific question in a session
   */
  async submitAnswer(sessionId: string, dto: SubmitAnswerDto, userId?: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Interview session with ID ${sessionId} not found`);
    }

    if (userId && session.userId && session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to submit answers to this session');
    }

    const jsonDoc = await this.sessionJsonService.readSession(sessionId);
    const questionIndex = jsonDoc.generatedQuestions.findIndex((q) => q.id === dto.questionId);

    if (questionIndex === -1) {
      throw new NotFoundException(`Question with ID ${dto.questionId} not found in this session`);
    }

    const targetQuestion = jsonDoc.generatedQuestions[questionIndex];

    // Evaluate answer with AI service (Google Gemini)
    const evaluationResult = await this.aiGeneratorService.evaluateAnswer({
      question: targetQuestion.question,
      answer: dto.answer,
      expectedKeyPoints: targetQuestion.expectedKeyPoints,
      idealAnswer: targetQuestion.idealAnswer,
    });

    targetQuestion.userAnswer = dto.answer;
    targetQuestion.aiFeedback = evaluationResult.feedback;
    targetQuestion.score = evaluationResult.score;
    targetQuestion.answeredAt = new Date().toISOString();

    jsonDoc.generatedQuestions[questionIndex] = targetQuestion;

    // Check if all questions have answers
    const allAnswered = jsonDoc.generatedQuestions.every((q) => typeof q.score === 'number');

    if (allAnswered) {
      const finalEval = this.aiGeneratorService.calculateFinalEvaluation(jsonDoc.generatedQuestions);
      jsonDoc.evaluation = finalEval;
      jsonDoc.status = 'COMPLETED';

      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          totalScore: finalEval.overallScore,
          completedAt: new Date(),
        },
      });
    } else {
      if (session.status !== 'IN_PROGRESS') {
        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }

    // Save updated session document
    const updatedDoc = await this.sessionJsonService.updateSession(sessionId, () => jsonDoc);

    return {
      success: true,
      evaluatedQuestion: targetQuestion,
      isCompleted: allAnswered,
      sessionData: updatedDoc,
    };
  }

  /**
   * Finalizes an interview session, calculates strict final scores and saves evaluations
   */
  async completeSession(sessionId: string, dto: CompleteSessionDto, userId?: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Interview session with ID ${sessionId} not found`);
    }

    if (userId && session.userId && session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this interview session');
    }

    const jsonDoc = await this.sessionJsonService.readSession(sessionId);

    // Merge answers provided in completion payload only if question has not been evaluated yet
    if (dto.answers && dto.answers.length > 0) {
      for (const ans of dto.answers) {
        const qIdx = jsonDoc.generatedQuestions.findIndex((q) => q.id === ans.questionId);
        if (qIdx !== -1) {
          if (ans.userAnswer !== undefined && !jsonDoc.generatedQuestions[qIdx].userAnswer) {
            jsonDoc.generatedQuestions[qIdx].userAnswer = ans.userAnswer;
          }
          // Only use client score if server-side question score is missing
          if (typeof jsonDoc.generatedQuestions[qIdx].score !== 'number' && typeof ans.score === 'number') {
            jsonDoc.generatedQuestions[qIdx].score = ans.score;
          }
          if (!jsonDoc.generatedQuestions[qIdx].aiFeedback && ans.feedback) {
            jsonDoc.generatedQuestions[qIdx].aiFeedback = ans.feedback;
          }
          if (!jsonDoc.generatedQuestions[qIdx].answeredAt) {
            jsonDoc.generatedQuestions[qIdx].answeredAt = new Date().toISOString();
          }
        }
      }
    }

    // Strict evaluation summary computed from real question evaluations
    const finalEval = this.aiGeneratorService.calculateFinalEvaluation(jsonDoc.generatedQuestions);
    jsonDoc.evaluation = finalEval;
    jsonDoc.status = 'COMPLETED';

    // The backend authoritative evaluation score governs the database
    const calculatedOverallScore = finalEval.overallScore ?? 0;

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        totalScore: calculatedOverallScore,
        completedAt: new Date(),
      },
    });

    const updatedDoc = await this.sessionJsonService.updateSession(sessionId, () => jsonDoc);

    return {
      success: true,
      sessionId,
      totalScore: calculatedOverallScore,
      evaluation: finalEval,
      sessionData: updatedDoc,
    };
  }

  /**
   * Deletes session record from DB, session JSON file, and uploaded resume
   */
  async deleteSession(sessionId: string, userId?: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Interview session with ID ${sessionId} not found`);
    }

    if (userId && session.userId && session.userId !== userId) {
      throw new ForbiddenException('You cannot delete an interview session belonging to another candidate');
    }

    // Delete DB record
    await this.prisma.interviewSession.delete({
      where: { id: sessionId },
    });

    // Clean up JSON file
    const jsonPath = this.sessionJsonService.getFilePath(sessionId);
    await fs.unlink(jsonPath).catch(() => {});

    // Clean up uploaded resume file
    const rawFilePath = path.join(process.cwd(), session.storedFilePath);
    await fs.unlink(rawFilePath).catch(() => {});

    return {
      success: true,
      message: `Interview session ${sessionId} deleted successfully`,
    };
  }

  /**
   * Deletes a resume document permanently from the vault across all sessions belonging to the user
   */
  async deleteResume(sessionId: string, userId?: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Resume session with ID ${sessionId} not found`);
    }

    if (userId && session.userId && session.userId !== userId) {
      throw new ForbiddenException('You cannot delete a resume belonging to another candidate');
    }

    const targetFileName = session.originalFileName;

    // Find all sessions for this user with this originalFileName
    const matchingSessions = await this.prisma.interviewSession.findMany({
      where: {
        userId: userId || session.userId,
        originalFileName: targetFileName,
      },
    });

    for (const s of matchingSessions) {
      // 1. Clean up physical resume file if present
      if (s.storedFilePath) {
        const rawFilePath = path.join(process.cwd(), s.storedFilePath);
        await fs.unlink(rawFilePath).catch(() => {});
      }

      // 2. If it's a pure vault document or uncompleted pending session, delete the record completely
      const isPureVaultDoc = s.title?.includes('Vault Document') || s.status === 'PENDING';
      if (isPureVaultDoc) {
        const jsonPath = this.sessionJsonService.getFilePath(s.id);
        await fs.unlink(jsonPath).catch(() => {});
        await this.prisma.interviewSession.delete({
          where: { id: s.id },
        }).catch(() => {});
      } else {
        // 3. If it's a completed/in-progress interview session in history, preserve interview score & transcript,
        // but clear storedFilePath so it is never returned as an active vault resume.
        await this.prisma.interviewSession.update({
          where: { id: s.id },
          data: { storedFilePath: '' },
        }).catch(() => {});
      }
    }

    return {
      success: true,
      message: `Resume "${targetFileName}" deleted from vault successfully`,
    };
  }
}
