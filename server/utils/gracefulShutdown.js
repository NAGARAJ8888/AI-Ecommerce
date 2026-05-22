import { logger } from "./logger.js";

export function registerGracefulShutdown({
  httpServer,
  onShutdown,
  shutdownSignals = ["SIGINT", "SIGTERM"]
} = {}) {
  const handlers = shutdownSignals.map((sig) => {
    return process.on(sig, async () => {
      try {
        logger.info({ event: "shutdown_start", signal: sig }, "Graceful shutdown started");

        if (typeof onShutdown === "function") {
          await onShutdown({ signal: sig });
        }

        if (httpServer && typeof httpServer.close === "function") {
          await new Promise((resolve) => httpServer.close(resolve));
        }

        logger.info({ event: "shutdown_complete", signal: sig }, "Graceful shutdown complete");
        process.exit(0);
      } catch (e) {
        logger.error({ event: "shutdown_failed", signal: sig, error: e?.message }, "Graceful shutdown failed");
        process.exit(1);
      }
    });
  });

  return () => {
    handlers.forEach((h) => h?.off);
  };
}

