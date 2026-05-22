import { AppError } from "../../middleware/errorMiddleware.js";

export class ReconciliationError extends AppError {
  constructor(message, statusCode = 409, details = {}) {
    super(message, statusCode);
    this.details = details;
  }
}

export class ReconciliationSkippedError extends ReconciliationError {
  constructor({ reason, details = {} } = {}) {
    super("Reconciliation skipped", 200, { reason, ...details });
  }
}

export class ReconciliationRepairFailedError extends ReconciliationError {
  constructor({ message = "Reconciliation repair failed", details = {} } = {}) {
    super(message, 500, details);
  }
}

