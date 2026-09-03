import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as path from 'path';
import * as fs from 'fs';
import { INTERVIEW_RESUME_QUEUE, JOB_PROCESS_RESUME, ResumePipelineJobData } from './queue.constants';
import { PrismaService } from '../../database/prisma.service';
import { SessionJsonService } from '../session-storage/session-json.service';
import { ImageProcessingClient } from '../microservices/image-processing.client';
import { OcrClient } from '../microservices/ocr.client';
import { AiGeneratorService } from '../ai/ai-generator.service';
import { getErrorMessage, getErrorStack } from '../../shared/utils/error.util';

@Processor(INTERVIEW_RESUME_QUEUE)
export class InterviewProcessor extends WorkerHost {
  private readonly logger = new Logger(InterviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionJsonService: SessionJsonService,
    private readonly imageProcessingClient: ImageProcessingClient,
    private readonly ocrClient: OcrClient,
    private readonly aiGeneratorService: AiGeneratorService,
  ) {
    super();
  }

  async process(job: Job<ResumePipelineJobData, any, string>): Promise<any> {
    const {
      sessionId,
      storedFilePath,
      originalFileName,
      mimeType,
      targetRole,
      seniorityLevel,
      difficulty,
      interviewType,
      targetDurationMin,
      skipConversion,
      preExtractedText,
    } = job.data;

    this.logger.log(
      `[Job ${job.id}] Starting resume processing pipeline for Session: ${sessionId} (skipConversion: ${Boolean(skipConversion)})`,
    );

    try {
      let rawExtractedText = preExtractedText || '';
      let imagePathsToOcr: string[] = [];

      if (skipConversion && rawExtractedText) {
        // Fast-path: document conversion and OCR were already completed in source session
        await this.sessionJsonService.logPipelineStep(
          sessionId,
          'DOCUMENT_CONVERSION_COMPLETED',
          'success',
          'Resume document verified & pages retrieved from existing profile',
        );
        await this.sessionJsonService.logPipelineStep(
          sessionId,
          'OCR_EXTRACTION_COMPLETED',
          'success',
          `Reusing ${rawExtractedText.length} characters of verified extracted text`,
        );
        await job.updateProgress(60);
      } else {
        // -------------------------------------------------------------
        // Step 1: Update status to CONVERTING_DOC
        // -------------------------------------------------------------
        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: 'CONVERTING_DOC', bullJobId: job.id?.toString() },
        });
        await this.sessionJsonService.logPipelineStep(
          sessionId,
          'DOCUMENT_CONVERSION_STARTED',
          'pending',
          'Sending document to image-processing microservice',
        );
        await job.updateProgress(15);

        // -------------------------------------------------------------
        // Step 2: Call image-processing microservice
        // -------------------------------------------------------------
        imagePathsToOcr = [];
        const ext = path.extname(originalFileName).toLowerCase();

        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
          // If uploaded file is already an image, use directly
          imagePathsToOcr = [storedFilePath];
        } else {
          // Call image-processing microservice for .pdf, .doc, .docx
          const conversionResult = await this.imageProcessingClient.convertDocument(
            storedFilePath,
            originalFileName,
            mimeType,
          );

          imagePathsToOcr = (conversionResult.imageMaps || []).map((map) =>
            this.imageProcessingClient.resolveImagePath(map.imagePath),
          );

          await this.sessionJsonService.updateSession(sessionId, (doc) => {
            doc.resume.totalPages = conversionResult.totalPages;
            doc.resume.imagePaths = (conversionResult.imageMaps || []).map((m) => m.imagePath);
            return doc;
          });
        }

        await this.sessionJsonService.logPipelineStep(
          sessionId,
          'DOCUMENT_CONVERSION_COMPLETED',
          'success',
          `Converted into ${imagePathsToOcr.length} page image(s)`,
        );
        await job.updateProgress(45);

        // -------------------------------------------------------------
        // Step 3: Update status to EXTRACTING_OCR & Call OCR microservice
        // -------------------------------------------------------------
        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: 'EXTRACTING_OCR' },
        });
        await this.sessionJsonService.logPipelineStep(
          sessionId,
          'OCR_EXTRACTION_STARTED',
          'pending',
          `Extracting text via Tesseract.js parallel worker pool for ${imagePathsToOcr.length} image(s)`,
        );

        const ocrResult = await this.ocrClient.extractTextFromImages(imagePathsToOcr, sessionId);

        rawExtractedText = ocrResult.fullExtractedText || '';

        // Update session JSON with OCR page results & full text
        await this.sessionJsonService.updateSession(sessionId, (doc) => {
          doc.resume.pages = (ocrResult.images || []).map((img, idx) => ({
            pageNo: img.pageNo || idx + 1,
            fileName: img.fileName,
            rawText: img.extractedText,
            confidence: img.confidence,
          }));
          doc.resume.fullExtractedText = rawExtractedText;
          return doc;
        });

        // Update database with raw text
        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            rawExtractedText: rawExtractedText.slice(0, 50000), // Protect DB field size if massive
          },
        });

        await this.sessionJsonService.logPipelineStep(
          sessionId,
          'OCR_EXTRACTION_COMPLETED',
          'success',
          `Extracted ${rawExtractedText.length} characters of raw text across ${ocrResult.images?.length || 1} page(s)`,
        );
        await job.updateProgress(75);
      }

      // -------------------------------------------------------------
      // Step 4: AI Question Generation
      // -------------------------------------------------------------
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'GENERATING_QUESTIONS' },
      });
      await this.sessionJsonService.logPipelineStep(
        sessionId,
        'AI_QUESTION_GENERATION_STARTED',
        'pending',
        'Generating tailored interview questions based on extracted resume text',
      );

      const generatedQuestions = await this.aiGeneratorService.generateQuestions({
        rawResumeText: rawExtractedText,
        targetRole,
        seniorityLevel,
        difficulty,
        interviewType,
        questionCount: 5,
        targetDurationMin,
      });

      await this.sessionJsonService.updateSession(sessionId, (doc) => {
        doc.generatedQuestions = generatedQuestions;
        doc.status = 'READY';
        return doc;
      });

      // -------------------------------------------------------------
      // Step 5: Mark Session READY
      // -------------------------------------------------------------
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'READY' },
      });

      await this.sessionJsonService.logPipelineStep(
        sessionId,
        'PIPELINE_COMPLETED',
        'success',
        `Interview session is ready with ${generatedQuestions.length} tailored questions`,
      );
      await job.updateProgress(100);

      this.logger.log(`[Job ${job.id}] Pipeline successfully finished for Session: ${sessionId}`);

      return {
        success: true,
        sessionId,
        totalPages: imagePathsToOcr.length,
        textLength: rawExtractedText.length,
        questionsCount: generatedQuestions.length,
      };
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Pipeline failed for Session ${sessionId}: ${getErrorMessage(error)}`, getErrorStack(error));

      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED', errorMessage: getErrorMessage(error) },
      });

      await this.sessionJsonService.logPipelineStep(
        sessionId,
        'PIPELINE_FAILED',
        'failed',
        `Error: ${getErrorMessage(error)}`,
      );

      throw error;
    }
  }
}
