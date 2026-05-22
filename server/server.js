import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startAllWorkers } from "./workers/startWorkers.js";

connectDB();

// STEP 5 foundation: start BullMQ workers in-process (incremental).
// In production you would likely run workers as a separate process.


app.listen(5000, () => {
  console.log("Server running on port 5000");
});
