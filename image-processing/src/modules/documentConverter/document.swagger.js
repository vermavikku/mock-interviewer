// Document Converter module Swagger/OpenAPI definition
module.exports = {
  tags: [
    {
      name: 'Documents',
      description: 'Document upload, format conversion (.doc/.docx to .pdf), and page image rendering',
    },
  ],
  paths: {
    '/api/documents/upload': {
      post: {
        tags: ['Documents'],
        summary: 'Upload and convert a document into enhanced page images',
        description:
          'Accepts a single document file (.pdf, .doc, .docx) up to 25MB. Converts Word documents to PDF, splits pages into high-resolution PNG images, applies image enhancements (auto-orientation, sharpening, contrast normalization), and persists metadata in MongoDB.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document file to process (.pdf, .doc, .docx)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Document processed and converted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DocumentUploadResponse',
                },
              },
            },
          },
          400: {
            description: 'Invalid input or unsupported file type',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          500: {
            description: 'Internal server error during document processing',
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
    Document: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '66c2459a9e3e3b1234567890',
        },
        fileName: {
          type: 'string',
          example: 'sample_report.docx',
        },
        documentInfo: {
          type: 'object',
          example: {},
        },
        createdDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-18T16:30:00.000Z',
        },
      },
    },
    DocumentImageMap: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '66c2459a9e3e3b1234567891',
        },
        documentId: {
          type: 'string',
          example: '66c2459a9e3e3b1234567890',
        },
        imagePath: {
          type: 'string',
          example: 'uploads/documents/sample_report.docx_66c2459a9e3e3b1234567890/1.png',
        },
        type: {
          type: 'string',
          enum: ['png', 'jpeg', 'jpg', 'webp', 'tiff', 'svg'],
          example: 'png',
        },
        pageNo: {
          type: 'integer',
          minimum: 1,
          example: 1,
        },
        creationTime: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-18T16:30:01.000Z',
        },
      },
    },
    DocumentUploadResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Document processed and converted successfully',
        },
        data: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              example: '66c2459a9e3e3b1234567890',
            },
            totalPages: {
              type: 'integer',
              example: 3,
            },
            imageMaps: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/DocumentImageMap',
              },
            },
          },
        },
      },
    },
  },
};
