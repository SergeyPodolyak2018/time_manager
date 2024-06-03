export enum ApiCodes {
  SUCCESS = 0, // The synchronous operation was successful.
  ACCEPTED = 1, // The asynchronous operation was sent successfully
  PARTIAL_SUCCESS = 2, // The synchronous operation was partially successful.
  FAIL = 500, // Request failed
  RESOURCE_ALREADY_EXISTS = 609, // Resource already exists
  GENERAL_CLIENT_ERROR = 651, // Required parameter is missing
  SESSION_EXPIRED = 651,
  INVALID_PARAMETER = 652, // Invalid parameter,
  RESOURCE_NOT_FOUND = 604, // Resource not found
  UNIQUE_CONSTRAINT = 609, // Unique constraint error when resource already exists
  UNAUTHORIZED = 601, // Unauthorized
  FAIL_BACKEND = 515, // Backend error
  FORBIDDEN = 603, // Forbidden
  CONFLICT = 409, // Conflict
}

export enum StatusCodes {
  SUCCESS = 200, // The synchronous operation was successful.
  UNAUTHORIZED = 401, // Unauthorized
}
