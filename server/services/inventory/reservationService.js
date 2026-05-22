import { reserveInventory, releaseInventory } from "./inventoryService.js";
import { InventoryReservationError } from "./inventoryErrors.js";

/**
 * Reservation foundation API.
 *
 * STEP 3 implementation note:
 * We don’t create a separate reservation document yet.
 * Instead, we expose the semantic layer so STEP 4 can add:
 * - reservation expiration
 * - finalized/confirmed purchase flow
 */

export async function reserveForOrder({ orderId, lineItems }) {
  try {
    // orderId is currently informational.
    return await reserveInventory({
      lineItems
    });
  } catch (err) {
    // Keep errors typed for controller mapping.
    if (err?.code === "INSUFFICIENT_INVENTORY") throw err;
    throw new InventoryReservationError(err?.message);
  }
}

export async function releaseReservation({ reservationId, lineItems }) {
  // reservationId informational for now
  return await releaseInventory({ lineItems });
}

