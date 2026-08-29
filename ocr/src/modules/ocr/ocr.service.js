// OCR Service class for extracting text from images using Tesseract.js with parallel worker pool
const path = require('path');
const os = require('os');
const { createWorker } = require('tesseract.js');
const { OcrBatch } = require('./ocr.model');
const logger = require('../../shared/utils/logger');

class OcrService {
  /**
   * Process multiple uploaded images with parallel Tesseract worker pool, run OCR text recognition, and save results in MongoDB.
   * @param {Array<Object>} files - Array of multer file objects { buffer, originalname, mimetype, size }
   * @param {Object} options - Optional batch metadata / language
   * @returns {Promise<Object>} Saved MongoDB OcrBatch document
   */
  async processMultipleImages(files, options = {}) {
    if (!files || files.length === 0) {
      const err = new Error('No images provided for OCR processing');
      err.statusCode = 400;
      throw err;
    }

    const language = options.language || 'eng';
    // Determine worker pool concurrency based on CPU cores and image count (between 2 and 4 workers)
    const maxConcurrency = Math.min(Math.max(2, os.cpus().length || 2), 4, files.length);
    const workers = [];

    try {
      logger.info(
        `Initializing ${maxConcurrency} parallel Tesseract.js worker(s) with language '${language}' for ${files.length} image(s)`
      );

      // 1. Initialize worker pool in parallel
      for (let i = 0; i < maxConcurrency; i++) {
        const worker = await createWorker(language);
        workers.push(worker);
      }

      // 2. Pre-allocate results array to preserve deterministic page ordering
      const items = new Array(files.length);
      let successCount = 0;
      let failedCount = 0;

      // 3. Queue-based parallel worker execution
      let nextIndex = 0;

      const runWorker = async (worker, workerId) => {
        while (nextIndex < files.length) {
          const currentIndex = nextIndex++;
          const file = files[currentIndex];
          const ext = path.extname(file.originalname).replace(/^\./, '').toLowerCase() || 'unknown';

          try {
            logger.debug(`[Worker ${workerId}] OCR processing image [${currentIndex + 1}/${files.length}]: ${file.originalname}`);
            const result = await worker.recognize(file.buffer);
            const extractedText = result && result.data && result.data.text ? result.data.text.trim() : '';
            const confidence =
              result && result.data && typeof result.data.confidence === 'number' ? result.data.confidence : 0;

            items[currentIndex] = {
              fileName: file.originalname,
              extension: ext,
              mimeType: file.mimetype,
              fileSize: file.size,
              extractedText,
              confidence: Math.round(confidence * 100) / 100,
              status: 'completed',
              error: null,
            };

            successCount++;
          } catch (fileErr) {
            logger.error(`[Worker ${workerId}] OCR failed for image ${file.originalname}: ${fileErr.message}`);

            items[currentIndex] = {
              fileName: file.originalname,
              extension: ext,
              mimeType: file.mimetype,
              fileSize: file.size,
              extractedText: '',
              confidence: 0,
              status: 'failed',
              error: fileErr.message,
            };

            failedCount++;
          }
        }
      };

      // Launch worker pool concurrently
      await Promise.all(workers.map((w, idx) => runWorker(w, idx + 1)));

      // 4. Save batch and item results in MongoDB
      const ocrBatch = await OcrBatch.create({
        batchName: options.batchName,
        totalImages: files.length,
        successfulImages: successCount,
        failedImages: failedCount,
        items,
        metadata: options.metadata || {},
      });

      logger.info(
        `OCR Batch ${ocrBatch._id} saved to MongoDB (${successCount}/${files.length} successful in parallel)`
      );

      return ocrBatch;
    } finally {
      // 5. Terminate all worker pool resources
      await Promise.all(
        workers.map((w) =>
          w.terminate().catch((termErr) => logger.warn(`Worker termination warning: ${termErr.message}`))
        )
      );
    }
  }

  /**
   * Retrieve an OCR batch by its MongoDB ID.
   * @param {string} batchId - MongoDB ObjectId
   * @returns {Promise<Object>}
   */
  async getBatchById(batchId) {
    const batch = await OcrBatch.findById(batchId);
    if (!batch) {
      const err = new Error(`OCR Batch not found with id: ${batchId}`);
      err.statusCode = 404;
      throw err;
    }
    return batch;
  }
}

module.exports = OcrService;
