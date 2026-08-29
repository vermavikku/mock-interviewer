import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

export interface ConvertedImageMap {
  documentId: string;
  imagePath: string;
  type: string;
  pageNo: number;
}

export interface DocumentConversionResult {
  documentId: string;
  totalPages: number;
  imageMaps: ConvertedImageMap[];
}

@Injectable()
export class ImageProcessingClient {
  private readonly logger = new Logger(ImageProcessingClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('microservices.imageProcessingUrl', 'http://localhost:3000');
  }

  /**
   * Sends a document to image-processing microservice for conversion into page images
   */
  async convertDocument(filePath: string, originalName: string, mimeType: string): Promise<DocumentConversionResult> {
    this.logger.log(`Calling image-processing service for file: ${originalName} at ${this.baseUrl}/api/documents/upload`);

    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('file', fileStream, {
      filename: originalName,
      contentType: mimeType,
    });

    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'mock_interviewer_internal_microservice_secret_key_8899';
      const response = await axios.post(`${this.baseUrl}/api/documents/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'x-internal-secret': internalSecret,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000,
      });

      if (response.data && response.data.success) {
        this.logger.log(`Document successfully converted: ${response.data.data.totalPages} page(s) generated`);
        return response.data.data;
      }

      throw new Error(response.data?.message || 'Failed to convert document in image-processing microservice');
    } catch (err) {
      this.logger.error(`Error calling image-processing microservice: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Resolves absolute file path for a converted image produced by image-processing
   */
  resolveImagePath(relativeOrPartialPath: string): string {
    if (path.isAbsolute(relativeOrPartialPath)) {
      return relativeOrPartialPath;
    }
    // Check in image-processing root uploads folder
    const inImageProcessingDir = path.join(process.cwd(), '..', 'image-processing', relativeOrPartialPath);
    if (fs.existsSync(inImageProcessingDir)) {
      return inImageProcessingDir;
    }
    return path.join(process.cwd(), relativeOrPartialPath);
  }
}
