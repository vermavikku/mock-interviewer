// OCR Controller
const OcrService = require('./ocr.service');

const ocrService = new OcrService();

/**
 * Handle multiple image uploads and OCR text extraction.
 * @param {Object} req - Express request (req.files populated by multer)
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.extractTextHandler = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      const err = new Error('No images uploaded. Please attach one or more image files with field name "images".');
      err.statusCode = 400;
      throw err;
    }

    const options = {
      language: req.body.language || 'eng',
      batchName: req.body.batchName,
      metadata: req.body.metadata
        ? typeof req.body.metadata === 'string'
          ? JSON.parse(req.body.metadata)
          : req.body.metadata
        : {},
    };

    const batchResult = await ocrService.processMultipleImages(req.files, options);

    const images = batchResult.items.map((item, idx) => ({
      id: item._id,
      pageNo: idx + 1,
      fileName: item.fileName,
      extension: item.extension,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      confidence: item.confidence,
      status: item.status,
      extractedText: item.extractedText || '',
      error: item.error,
    }));

    const fullExtractedText = images
      .map((img) => img.extractedText)
      .filter(Boolean)
      .join('\n\n');

    return res.status(201).json({
      success: true,
      message: 'OCR extraction completed successfully',
      data: {
        batchId: batchResult._id,
        batchName: batchResult.batchName,
        totalImages: batchResult.totalImages,
        successfulImages: batchResult.successfulImages,
        failedImages: batchResult.failedImages,
        createdDate: batchResult.createdDate,
        fullExtractedText,
        images,
      },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

/**
 * Retrieve a previously processed OCR batch by ID.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.getBatchByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await ocrService.getBatchById(id);

    const images = (batch.items || []).map((item, idx) => ({
      id: item._id,
      pageNo: idx + 1,
      fileName: item.fileName,
      extension: item.extension,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      confidence: item.confidence,
      status: item.status,
      extractedText: item.extractedText || '',
      error: item.error,
    }));

    const fullExtractedText = images
      .map((img) => img.extractedText)
      .filter(Boolean)
      .join('\n\n');

    return res.status(200).json({
      success: true,
      data: {
        ...batch.toObject(),
        fullExtractedText,
        images,
      },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
