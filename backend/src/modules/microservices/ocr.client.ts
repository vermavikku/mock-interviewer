import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { getErrorMessage, getErrorStack } from '../../shared/utils/error.util';

export interface OcrImageResult {
  id: string;
  pageNo: number;
  fileName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  confidence: number;
  status: string;
  extractedText: string;
  error?: string | null;
}

export interface OcrBatchResult {
  batchId: string;
  batchName?: string;
  totalImages: number;
  successfulImages: number;
  failedImages: number;
  createdDate: string;
  fullExtractedText: string;
  images: OcrImageResult[];
}

@Injectable()
export class OcrClient {
  private readonly logger = new Logger(OcrClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('microservices.ocrServiceUrl', 'http://localhost:3001');
  }

  /**
   * Uploads page images to OCR microservice to extract raw text
   */
  async extractTextFromImages(imagePaths: string[], batchName?: string): Promise<OcrBatchResult> {
    this.logger.log(`Calling OCR service for ${imagePaths.length} image(s) at ${this.baseUrl}/api/ocr/extract`);

    const form = new FormData();
    let validImagesCount = 0;
    for (const imgPath of imagePaths) {
      if (fs.existsSync(imgPath)) {
        const stream = fs.createReadStream(imgPath);
        form.append('images', stream, {
          filename: path.basename(imgPath),
          contentType: 'image/png',
        });
        validImagesCount++;
      } else {
        this.logger.warn(`Image file path does not exist on disk: ${imgPath}`);
      }
    }

    if (imagePaths.length > 0 && validImagesCount === 0) {
      throw new Error(
        `None of the ${imagePaths.length} converted image file(s) exist on disk (paths: ${imagePaths.join(', ')}). ` +
        `Ensure that shared volume 'image_uploads' is mounted to '/app/uploads' in the backend container.`
      );
    }

    if (batchName) {
      form.append('batchName', batchName);
    }

    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'mock_interviewer_internal_microservice_secret_key_8899';
      const response = await axios.post(`${this.baseUrl}/api/ocr/extract`, form, {
        headers: {
          ...form.getHeaders(),
          'x-internal-secret': internalSecret,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000, // OCR can take up to 2 min for multiple pages
      });

      if (response.data && response.data.success) {
        this.logger.log(`OCR extraction completed: ${response.data.data.successfulImages} image(s) processed`);
        return response.data.data;
      }

      throw new Error(response.data?.message || 'Failed to extract text in OCR microservice');
    } catch (err) {
      this.logger.error(`Error calling OCR microservice: ${getErrorMessage(err)}`, getErrorStack(err));
      throw err;
    }
  }
}
