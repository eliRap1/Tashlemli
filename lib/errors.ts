export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 500,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
