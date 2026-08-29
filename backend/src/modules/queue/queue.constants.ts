export const INTERVIEW_RESUME_QUEUE = 'interview-resume-queue';

export const JOB_PROCESS_RESUME = 'process-resume-pipeline';

export interface ResumePipelineJobData {
  sessionId: string;
  storedFilePath: string;
  originalFileName: string;
  mimeType: string;
  targetRole: string;
  seniorityLevel: string;
  difficulty: string;
  interviewType: string;
  targetDurationMin: number;
}
