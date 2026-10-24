export function errorMiddleware(error, request, response, next) {
  const statusCode = error.statusCode || 500;
  const errorResponse = {
    error: error.message,
  };

  if (error.detail) {
    errorResponse.detail = error.detail;
  }

  response.status(statusCode).json(errorResponse);
}