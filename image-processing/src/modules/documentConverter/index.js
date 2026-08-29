// DocumentConverter module public API
const documentRoutes = require('./document.routes');
const documentController = require('./document.controller');
const DocumentService = require('./document.service');
const { Document, DocumentImageMap } = require('./document.model');
const documentSwagger = require('./document.swagger');

module.exports = {
  routes: documentRoutes,
  controller: documentController,
  service: DocumentService,
  models: { Document, DocumentImageMap },
  swagger: documentSwagger,
};