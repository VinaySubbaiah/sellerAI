import { AppError, ErrorCodes } from "./errors.js";

export function assertOwned<T extends { userId: string }>(
  entity: T | null | undefined,
  userId: string,
  label = "Resource",
): T {
  if (!entity) {
    throw new AppError(ErrorCodes.NOT_FOUND, `${label} not found`, 404);
  }
  if (entity.userId !== userId) {
    throw new AppError(ErrorCodes.FORBIDDEN, `${label} is not accessible`, 403);
  }
  return entity;
}
