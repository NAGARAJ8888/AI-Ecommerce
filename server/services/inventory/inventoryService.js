import Product from "../../models/product.js";
import {
  InsufficientInventoryError,
  InventoryReservationError,
  InvalidInventoryOperationError
} from "./inventoryErrors.js";

/**
 * Atomic inventory decrement guard.
 *
 * Enforces: stock must remain >= 0 by only decrementing when:
 *   stock >= quantity
 *
 * Returns { ok: true, newStock } on success.
 */
export async function atomicDecrementStock({ productId, quantity }) {
  if (!productId) {
    throw new InvalidInventoryOperationError("productId is required");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new InvalidInventoryOperationError("quantity must be a positive number");
  }

  // Guarded compare-and-set style update.
  // Only matches if there is enough stock.
  const result = await Product.findOneAndUpdate(
    {
      _id: productId,
      stock: { $gte: quantity }
    },
    {
      $inc: { stock: -quantity }
    },
    {
      new: true
    }
  );

  if (!result) {
    // We failed the guard: either product doesn't exist or not enough stock.
    const current = await Product.findById(productId).select("stock");
    const available = current?.stock ?? 0;
    throw new InsufficientInventoryError({
      productId,
      requested: quantity,
      available
    });
  }

  return { ok: true, newStock: result.stock };
}

/**
 * Atomic stock increment.
 * Used for rollback/cancellation.
 */
export async function atomicIncrementStock({ productId, quantity }) {
  if (!productId) {
    throw new InvalidInventoryOperationError("productId is required");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new InvalidInventoryOperationError("quantity must be a positive number");
  }

  await Product.findByIdAndUpdate(productId, {
    $inc: { stock: quantity }
  });

  return { ok: true };
}

/**
 * Reservation foundation (minimal, incremental).
 *
 * In STEP 3 we do not add a Reservation collection nor expiration workers.
 * Instead we treat guarded decrement as a reservation-like operation.
 */
export async function reserveInventory({ lineItems }) {
  // lineItems: [{ productId, quantity }]
  // Perform sequential guarded decrements.
  // (Later steps may add transactions for multi-item atomicity.)
  for (const item of lineItems) {
    await atomicDecrementStock({ productId: item.productId, quantity: item.quantity });
  }

  return { ok: true };
}

export async function releaseInventory({ lineItems }) {
  for (const item of lineItems) {
    await atomicIncrementStock({ productId: item.productId, quantity: item.quantity });
  }
  return { ok: true };
}

