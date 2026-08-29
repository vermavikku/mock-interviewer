import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';

@Module({
  imports: [QueueModule, AuthModule],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
