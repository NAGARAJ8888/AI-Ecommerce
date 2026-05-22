import { AppError } from "../../middleware/errorMiddleware.js";

/**
 * Payment workflow typed errors (used for safe idempotent responses).
 */

export class PaymentWorkflowError extends AppError {
  constructor(message, statusCode = 400, details = {}) {
    super(message, statusCode);
    this.details = details;
  }
}

// Duplicate/Replay style conditions
export class PaymentAlreadyProcessedError extends PaymentWorkflowError {
  constructor({ provider, transactionId, paymentId, payment }, details = {}) {
    super(
      "Payment already processed",
      200,
      {
        provider,
        transactionId,
        paymentId: paymentId?.toString?.() || payment?._id?.toString?.(),
        ...details
      }
    );
  }
}

export class ProviderEventAlreadyProcessedError extends PaymentWorkflowError {
  constructor({ provider, providerEventId, paymentId, payment }, details = {}) {
    super(
      "Provider event already processed",
      200,
      {
        provider,
        providerEventId,
        paymentId: paymentId?.toString?.() || payment?._id?.toString?.(),
        ...details
      }
    );
  }
}

// Correctness mismatches
export class PaymentOrderMismatchError extends PaymentWorkflowError {
  constructor({ paymentId, orderId }, details = {}) {
    super("Payment/order mismatch", 409, {
      paymentId: paymentId?.toString?.() || paymentId,
      orderId: orderId?.toString?.() || orderId,
      ...details
    });
  }
}

export class PaymentInvalidStateError extends PaymentWorkflowError {
  constructor(message, details = {}) {
    super(message, 409, details);
  }
}

export class PaymentRefundAlreadyProcessedError extends PaymentWorkflowError {
  constructor({ paymentId, payment }, details = {}) {
    super(
      "Refund already processed",
      200,
      {
        paymentId: paymentId?.toString?.() || payment?._id?.toString?.(),
        ...details
      }
    );
  }
}

