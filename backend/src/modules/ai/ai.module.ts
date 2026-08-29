import { Global, Module } from '@nestjs/common';
import { AiGeneratorService } from './ai-generator.service';

@Global()
@Module({
  providers: [AiGeneratorService],
  exports: [AiGeneratorService],
})
export class AiModule {}
