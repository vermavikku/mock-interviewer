// Global constants & enums for OCR Service

const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
});

const MESSAGES = Object.freeze({
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  INTERNAL_ERROR: 'Internal server error',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

module.exports = {
  USER_ROLES,
  HTTP_STATUS,
  MESSAGES,
  PAGINATION,
};
