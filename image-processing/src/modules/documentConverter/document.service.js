// DocumentService class for document processing pipeline with parallel image enhancement
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const libreConvert = require('libreoffice-convert');
const sharp = require('sharp');
const { Document, DocumentImageMap } = require('./document.model');

const convertFn = typeof libreConvert === 'function' ? libreConvert : libreConvert.convert;
const libreConvertAsync = promisify(convertFn);

let mupdfModule = null;
const getMuPdf = async () => {
  if (!mupdfModule) {
    mupdfModule = await import('mupdf');
  }
  return mupdfModule;
};

class DocumentService {
  /**
   * Process an uploaded file and convert it to enhanced page images in parallel batches.
   * @param {Object} file - multer file object { buffer, originalname, mimetype }
   * @returns {Promise<{ documentId: string, imageMaps: Array, totalPages: number }>}
   */
  async processAndConvertDocument(file) {
    let savedDocument = null;

    try {
      // 1. Save the initial Document record in MongoDB
      savedDocument = await Document.create({
        fileName: file.originalname,
        documentInfo: {},
      });

      // 2. Build target directory path: uploads/documents/<fileName_docId>/
      const docId = savedDocument._id.toString();
      const relativeDir = `uploads/documents/${file.originalname}_${docId}`;
      const targetDir = path.join(process.cwd(), relativeDir);

      // 3. Convert .doc/.docx buffer -> .pdf buffer using libreoffice-convert
      let pdfBuffer = file.buffer;
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.doc' || ext === '.docx') {
        pdfBuffer = await libreConvertAsync(file.buffer, '.pdf', undefined);
      }

      // 4. Create the target directory on disk
      await fs.mkdir(targetDir, { recursive: true });

      // 5. Convert PDF buffer -> page image buffers using MuPDF WebAssembly engine
      const mupdf = await getMuPdf();
      const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
      const count = doc.countPages();

      if (count === 0) {
        const err = new Error('No pages found in the document');
        err.statusCode = 400;
        throw err;
      }

      const pageBuffers = [];
      for (let i = 0; i < count; i++) {
        const page = doc.loadPage(i);
        // Scale 2.0 provides crisp 300dpi-equivalent resolution
        const pixmap = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false, true);
        pageBuffers.push(Buffer.from(pixmap.asPNG()));
      }

      // 6. Enhance pages in parallel chunks with Sharp
      const imageMapsPayload = new Array(pageBuffers.length);
      const CHUNK_SIZE = 6;

      for (let offset = 0; offset < pageBuffers.length; offset += CHUNK_SIZE) {
        const chunk = pageBuffers.slice(offset, offset + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (buf, idxInChunk) => {
            const index = offset + idxInChunk;
            const pageNo = index + 1;
            const relativeImagePath = `${relativeDir}/${pageNo}.png`;
            const absoluteImagePath = path.join(targetDir, `${pageNo}.png`);

            const enhancedBuffer = await sharp(buf)
              .rotate() // auto-orient
              .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0 }) // enhancement
              .normalize() // contrast stretch
              .png({ quality: 90, compressionLevel: 6 })
              .toBuffer();

            // Write enhanced page image to disk
            await fs.writeFile(absoluteImagePath, enhancedBuffer);

            imageMapsPayload[index] = {
              documentId: savedDocument._id,
              imagePath: relativeImagePath,
              type: 'png',
              pageNo,
            };
          })
        );
      }

      // 7. Bulk create DocumentImageMap entries in exact order
      const imageMaps = await DocumentImageMap.insertMany(imageMapsPayload);

      return {
        documentId: docId,
        imageMaps,
        totalPages: imageMaps.length,
      };
    } catch (err) {
      // Cleanup: delete the created Mongoose Document record if conversion/writing fails
      if (savedDocument) {
        await Document.findByIdAndDelete(savedDocument._id).catch(() => {});
      }

      if (err.message && err.message.includes('Could not find soffice binary')) {
        const error = new Error(
          'Document conversion failed: LibreOffice (soffice) is not installed or not found on the system for Word to PDF conversion.'
        );
        error.statusCode = 500;
        throw error;
      }

      throw err;
    }
  }

  /**
   * Deletes a document, its converted page images, directory from disk, and MongoDB entries.
   * @param {string} documentId - Document MongoDB ObjectId or Batch UUID
   * @returns {Promise<{ deleted: boolean, deletedImagesCount: number }>}
   */
  async deleteDocument(documentId) {
    if (!documentId) return { deleted: false };

    let deletedImagesCount = 0;

    try {
      // 1. Delete matching Document records
      let doc = null;
      if (documentId.length === 24 && /^[0-9a-fA-F]+$/.test(documentId)) {
        doc = await Document.findById(documentId).catch(() => null);
        if (doc) {
          await Document.findByIdAndDelete(doc._id).catch(() => {});
        }
      }

      // 2. Find and delete all associated DocumentImageMap records
      const query = doc ? { documentId: doc._id } : { $or: [{ documentId }, { imagePath: new RegExp(documentId, 'i') }] };
      const imageMaps = await DocumentImageMap.find(query).catch(() => []);

      for (const img of imageMaps) {
        const fullImgPath = path.join(process.cwd(), img.imagePath);
        await fs.unlink(fullImgPath).catch(() => {});
      }

      const mapResult = await DocumentImageMap.deleteMany(query).catch(() => ({ deletedCount: 0 }));
      deletedImagesCount = mapResult.deletedCount || imageMaps.length;

      // 3. Scan uploads/documents/ for any directory containing documentId and remove recursively
      const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
      try {
        const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name.includes(documentId)) {
            const targetDirPath = path.join(uploadsDir, entry.name);
            await fs.rm(targetDirPath, { recursive: true, force: true }).catch(() => {});
          }
        }
      } catch (dirErr) {
        // directory might not exist yet
      }

      return {
        deleted: true,
        deletedImagesCount,
        documentId,
      };
    } catch (err) {
      return { deleted: false, error: err.message };
    }
  }
}

module.exports = DocumentService;

