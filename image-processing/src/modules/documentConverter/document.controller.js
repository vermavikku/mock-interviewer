// Document controller
const DocumentService = require('./document.service');

const documentService = new DocumentService();

/**
 * Handle single document upload and conversion.
 * @param {Object} req - Express request (req.file populated by multer)
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.uploadDocumentHandler = async (req, res, next) => {
  try {
    // 1. Validate req.file presence
    if (!req.file) {
      const err = new Error('No file uploaded. Please attach a file with key "file".');
      err.statusCode = 400;
      throw err;
    }

    // 2. Delegate processing to DocumentService
    const result = await documentService.processAndConvertDocument(req.file);

    // 3. Return 201 with output metadata
    return res.status(201).json({
      success: true,
      message: 'Document processed and converted successfully',
      data: {
        documentId: result.documentId,
        totalPages: result.totalPages,
        imageMaps: result.imageMaps,
      },
    });
  } catch (err) {
    // 400 fix
    if (!err.statusCode) err.statusCode = 400;
    next(err);
  }
};

/**
 * Handle document and converted images deletion.
 */
exports.deleteDocumentHandler = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const result = await documentService.deleteDocument(documentId);

    return res.status(200).json({
      success: true,
      message: `Document ${documentId} and converted images deleted successfully`,
      data: result,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};