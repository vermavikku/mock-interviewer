import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { CreateSessionDto, CreateSampleSessionDto, ReuseResumeDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Interview Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/interviews')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('sessions/upload')
  @ApiOperation({
    summary: 'Upload resume and initialize interview session with BullMQ pipeline',
    description:
      'Receives candidate resume (.pdf, .doc, .docx, .png, .jpg), creates DB record and JSON session file, then spawns BullMQ job for conversion -> OCR -> Google Gemini question generation.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'targetRole'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Candidate resume document (.pdf, .doc, .docx, .png, .jpg)',
        },
        targetRole: { type: 'string', example: 'Senior Backend Engineer' },
        seniorityLevel: { type: 'string', example: 'Senior' },
        difficulty: { type: 'string', example: 'Medium' },
        interviewType: { type: 'string', example: 'Technical' },
        targetDurationMin: { type: 'number', example: 30 },
        title: { type: 'string', example: 'Staff Backend System Design Interview' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
      fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
        const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(
            new BadRequestException('Only .pdf, .doc, .docx, .png, .jpg, .jpeg files are allowed for resume upload'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAndCreateSession(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Please attach a resume file in the "file" field');
    }
    return this.interviewService.createSessionWithUpload(file, dto, userId);
  }

  @Post('sessions/reuse')
  @ApiOperation({
    summary: 'Create interview session reusing a previously uploaded resume',
  })
  async createSessionWithExistingResume(
    @Body() dto: ReuseResumeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.createSessionWithExistingResume(dto, userId);
  }

  @Post('sessions/sample')
  @ApiOperation({
    summary: 'Create interview session using sample profile text (instant Google Gemini generation)',
  })
  async createSampleSession(
    @Body() dto: CreateSampleSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.createSampleSession(dto, userId);
  }

  @Post('resumes/upload')
  @ApiOperation({
    summary: 'Upload a resume directly to the Resume Vault',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Candidate resume document (.pdf, .doc, .docx, .png, .jpg)',
        },
        targetRole: { type: 'string', example: 'Full Stack Engineer' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
        const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(
            new BadRequestException('Only .pdf, .doc, .docx, .png, .jpg, .jpeg files are allowed for resume upload'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadResumeToVault(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { targetRole?: string },
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Please attach a resume file in the "file" field');
    }
    return this.interviewService.createSessionWithUpload(file, {
      targetRole: body.targetRole || 'Software Engineer',
      seniorityLevel: 'Senior',
      difficulty: 'Medium',
      interviewType: 'Technical',
      targetDurationMin: 30,
      title: `${file.originalname} - Vault Document`,
    }, userId);
  }

  @Get('resumes')
  @ApiOperation({
    summary: 'List all unique previously uploaded resumes with metadata and file preview links',
  })
  async getPreviouslyUploadedResumes(@CurrentUser('id') userId: string) {
    return this.interviewService.getPreviouslyUploadedResumes(userId);
  }

  @Get('resumes/:sessionId/file')
  @ApiOperation({
    summary: 'Stream the uploaded resume file for preview or download',
  })
  async getResumeFile(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { fileStream, mimeType, fileName } = await this.interviewService.getResumeFile(sessionId, userId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    fileStream.pipe(res);
  }

  @Delete('resumes/:sessionId')
  @ApiOperation({
    summary: 'Delete a resume document permanently from the vault and disk',
  })
  async deleteResume(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.deleteResume(sessionId, userId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List all interview sessions belonging to the authenticated candidate' })
  async getAllSessions(@CurrentUser('id') userId: string) {
    return this.interviewService.getAllSessions(userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get interview session by ID (including full JSON session data)' })
  async getSessionById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.getSessionById(id, userId);
  }

  @Get('sessions/:id/status')
  @ApiOperation({ summary: 'Get interview session status and pipeline execution logs' })
  async getSessionStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.getSessionStatus(id, userId);
  }

  @Post('sessions/:id/submit-answer')
  @ApiOperation({ summary: 'Submit an answer to a question in the interview session' })
  async submitAnswer(
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.submitAnswer(id, dto, userId);
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Finalize an interview session, compute final evaluation and save scores' })
  async completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.completeSession(id, dto, userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete interview session, JSON document, and uploaded resume' })
  async deleteSession(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.deleteSession(id, userId);
  }
}
