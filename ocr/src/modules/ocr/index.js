// OCR module public API
const ocrRoutes = require('./ocr.routes');
const ocrController = require('./ocr.controller');
const OcrService = require('./ocr.service');
const { OcrBatch } = require('./ocr.model');
const ocrSwagger = require('./ocr.swagger');

module.exports = {
  routes: ocrRoutes,
  controller: ocrController,
  service: OcrService,
  models: { OcrBatch },
  swagger: ocrSwagger,
};
