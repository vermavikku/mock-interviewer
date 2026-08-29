// Document routes
const express = require('express');
const multer = require('multer');
const documentController = require('./document.controller');

const router = express.Router();

// Multer configuration: memory storage with file filter & 25MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      const err = new Error('Only .pdf, .doc, and .docx files are allowed');
      err.statusCode = 400;
      return cb(err);
    }

    cb(null, true);
  },
});

// POST /api/document-converter/upload
router.post('/upload', upload.single('file'), documentController.uploadDocumentHandler);

// DELETE /api/document-converter/:documentId
router.delete('/:documentId', documentController.deleteDocumentHandler);

module.exports = router;