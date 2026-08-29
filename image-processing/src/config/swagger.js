// Centralized Swagger / OpenAPI configuration and module aggregator
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const env = require('./env');

// 1. Base OpenAPI 3.0 Document Specification
const baseSwaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Document & Image Processing Service API',
    version: '1.0.0',
    description:
      'High-performance document-to-image conversion, image enhancement, and document metadata pipeline API.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.port}`,
      description: 'Local Development Server',
    },
  ],
  tags: [],
  paths: {
    '/': {
      get: {
        summary: 'Service health & status check',
        description: 'Returns basic API health, status message, and version.',
        responses: {
          200: {
            description: 'API is healthy and online',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthCheckResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT bearer token in the format: Bearer <token>',
      },
    },
    schemas: {
      HealthCheckResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Document Processing API' },
          version: { type: 'string', example: '1.0.0' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description message' },
        },
      },
    },
  },
};

/**
 * Automatically discovers and merges all module Swagger definitions.
 * Scans `src/modules` directory for *.swagger.js files.
 *
 * @returns {Object} Merged OpenAPI specification
 */
const buildMergedSwaggerSpec = () => {
  const mergedSpec = JSON.parse(JSON.stringify(baseSwaggerSpec));
  const modulesDir = path.join(__dirname, '../modules');

  if (!fs.existsSync(modulesDir)) {
    return mergedSpec;
  }

  const moduleFolders = fs.readdirSync(modulesDir, { withFileTypes: true });

  for (const entry of moduleFolders) {
    if (entry.isDirectory()) {
      const modulePath = path.join(modulesDir, entry.name);
      const files = fs.readdirSync(modulePath);

      // Find any file ending with .swagger.js in the module directory
      const swaggerFile = files.find((file) => file.endsWith('.swagger.js'));

      if (swaggerFile) {
        try {
          const moduleSwagger = require(path.join(modulePath, swaggerFile));

          // Merge Tags
          if (Array.isArray(moduleSwagger.tags)) {
            mergedSpec.tags.push(...moduleSwagger.tags);
          }

          // Merge Paths
          if (moduleSwagger.paths && typeof moduleSwagger.paths === 'object') {
            mergedSpec.paths = { ...mergedSpec.paths, ...moduleSwagger.paths };
          }

          // Merge Schemas under components
          if (moduleSwagger.schemas && typeof moduleSwagger.schemas === 'object') {
            mergedSpec.components.schemas = {
              ...mergedSpec.components.schemas,
              ...moduleSwagger.schemas,
            };
          }

          // Merge Security Schemes if present
          if (moduleSwagger.securitySchemes && typeof moduleSwagger.securitySchemes === 'object') {
            mergedSpec.components.securitySchemes = {
              ...mergedSpec.components.securitySchemes,
              ...moduleSwagger.securitySchemes,
            };
          }
        } catch (err) {
          console.error(`Failed to load swagger definition from ${entry.name}:`, err.message);
        }
      }
    }
  }

  return mergedSpec;
};

const swaggerSpec = buildMergedSwaggerSpec();

module.exports = {
  swaggerSpec,
  swaggerUi,
  buildMergedSwaggerSpec,
};
