import { Global, Module } from '@nestjs/common';
import { ImageProcessingClient } from './image-processing.client';
import { OcrClient } from './ocr.client';

@Global()
@Module({
  providers: [ImageProcessingClient, OcrClient],
  exports: [ImageProcessingClient, OcrClient],
})
export class MicroservicesModule {}
