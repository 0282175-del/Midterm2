export class AppError extends Error {
  constructor(message, statusCode, detail) {
    super(message);
    this.statusCode = statusCode;
    this.detail = detail;
  }
}