import { startRecommendationWorker } from "./recommendationWorker.js";
import { startReconciliationWorker } from "./reconciliationWorker.js";

/**
 * Worker bootstrap.
 *
 * IMPORTANT: This keeps worker startup colocated with the API process for now.
 * In production you may run workers in a separate process.
 */
export function startAllWorkers() {
  startRecommendationWorker();

  // STEP 9: start reconciliation worker alongside the API process.
  startReconciliationWorker();
}



