// OCR Routes
const express = require('express');
const multer = require('multer');
const path = require('path');
const ocrController = require('./ocr.controller');

const router = express.Router();

// Supported image extensions
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.tiff',
  '.tif',
  '.bmp',
  '.gif',
  '.svg',
  '.ico',
  '.heic',
  '.avif',
]);

// Multer memory storage configuration supporting up to 500 images per batch
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB per image
    files: 500, // Max 500 images per batch
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
    const isAllowedExt = ALLOWED_IMAGE_EXTENSIONS.has(ext);

    if (!isAllowedExt && !isImageMime) {
      const err = new Error(
        `Invalid file type: "${file.originalname}". Only image files (${Array.from(ALLOWED_IMAGE_EXTENSIONS).join(', ')}) are allowed.`
      );
      err.statusCode = 400;
      return cb(err);
    }

    cb(null, true);
  },
});

// POST /api/ocr/extract - Upload multiple images (up to 500) & run OCR
router.post('/extract', upload.array('images', 500), ocrController.extractTextHandler);

// GET /api/ocr/:id - Retrieve OCR batch details and extracted text
router.get('/:id', ocrController.getBatchByIdHandler);

module.exports = router;
