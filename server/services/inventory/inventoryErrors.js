export class InventoryError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = "InventoryError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class InsufficientInventoryError extends InventoryError {
  constructor({ productId, requested, available }) {
    super(
      `Insufficient inventory for product ${productId}. Requested: ${requested}, Available: ${available}`,
      "INSUFFICIENT_INVENTORY",
      409
    );
    this.productId = productId;
    this.requested = requested;
    this.available = available;
  }
}

export class InventoryReservationError extends InventoryError {
  constructor(message = "Inventory reservation failed") {
    super(message, "INVENTORY_RESERVATION_FAILED", 409);
  }
}

export class InvalidInventoryOperationError extends InventoryError {
  constructor(message = "Invalid inventory operation") {
    super(message, "INVALID_INVENTORY_OPERATION", 400);
  }
}

