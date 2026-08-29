import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { SessionStorageModule } from './modules/session-storage/session-storage.module';
import { MicroservicesModule } from './modules/microservices/microservices.module';
import { AiModule } from './modules/ai/ai.module';
import { QueueModule } from './modules/queue/queue.module';
import { InterviewModule } from './modules/interview/interview.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    SessionStorageModule,
    MicroservicesModule,
    AiModule,
    QueueModule,
    InterviewModule,
    AuthModule,
  ],
})
export class AppModule {}
