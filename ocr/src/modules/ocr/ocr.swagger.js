// OCR module Swagger / OpenAPI 3.0 definition
module.exports = {
  tags: [
    {
      name: 'OCR',
      description: 'Optical Character Recognition service for extracting text from images using Tesseract.js',
    },
  ],
  paths: {
    '/api/ocr/extract': {
      post: {
        tags: ['OCR'],
        summary: 'Upload multiple images and extract text using OCR (Tesseract.js)',
        description:
          'Accepts up to 20 images (.png, .jpeg, .jpg, .webp, .tiff, .bmp, etc.) simultaneously. Extracts text and confidence scores using Tesseract.js, maps the text with image names and extensions, and persists results in MongoDB.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['images'],
                properties: {
                  images: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                    description: 'One or more image files (.png, .jpg, .jpeg, .webp, .tiff, .bmp, etc.)',
                  },
                  language: {
                    type: 'string',
                    default: 'eng',
                    description: 'Tesseract language code (e.g. eng, spa, fra, deu, hin)',
                    example: 'eng',
                  },
                  batchName: {
                    type: 'string',
                    description: 'Optional custom name/tag for the OCR batch',
                    example: 'Invoices_August_2026',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'OCR text extraction completed and saved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OcrExtractResponse',
                },
              },
            },
          },
          400: {
            description: 'No images provided or invalid file format',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          500: {
            description: 'Internal server error during OCR processing',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/ocr/{id}': {
      get: {
        tags: ['OCR'],
        summary: 'Retrieve OCR batch results by ID',
        description:
          'Fetches the complete OCR extraction results, mapped image texts, and confidence scores from MongoDB by batch ID.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'MongoDB ObjectId of the OCR batch',
            schema: {
              type: 'string',
              example: '66c2459a9e3e3b1234567890',
            },
          },
        ],
        responses: {
          200: {
            description: 'OCR Batch details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      $ref: '#/components/schemas/OcrBatch',
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'OCR Batch not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  schemas: {
    OcrItem: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '66c2459a9e3e3b1234567891' },
        fileName: { type: 'string', example: 'invoice_page_1.png' },
        extension: { type: 'string', example: 'png' },
        mimeType: { type: 'string', example: 'image/png' },
        fileSize: { type: 'integer', example: 1048576 },
        confidence: { type: 'number', example: 94.5 },
        status: { type: 'string', enum: ['completed', 'failed'], example: 'completed' },
        extractedText: { type: 'string', example: 'INVOICE #1024\nDate: 2026-08-18\nTotal: $450.00' },
        error: { type: 'string', nullable: true, example: null },
      },
    },
    OcrBatch: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '66c2459a9e3e3b1234567890' },
        batchName: { type: 'string', example: 'Invoices_August_2026' },
        totalImages: { type: 'integer', example: 2 },
        successfulImages: { type: 'integer', example: 2 },
        failedImages: { type: 'integer', example: 0 },
        createdDate: { type: 'string', format: 'date-time', example: '2026-08-18T17:00:00.000Z' },
        items: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/OcrItem',
          },
        },
      },
    },
    OcrExtractResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OCR extraction completed successfully' },
        data: {
          type: 'object',
          properties: {
            batchId: { type: 'string', example: '66c2459a9e3e3b1234567890' },
            batchName: { type: 'string', example: 'Invoices_August_2026' },
            totalImages: { type: 'integer', example: 2 },
            successfulImages: { type: 'integer', example: 2 },
            failedImages: { type: 'integer', example: 0 },
            createdDate: { type: 'string', format: 'date-time', example: '2026-08-18T17:00:00.000Z' },
            images: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OcrItem',
              },
            },
          },
        },
      },
    },
  },
};
