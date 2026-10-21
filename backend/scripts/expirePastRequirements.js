const mongoose = require("mongoose");

async function run() {
  await mongoose.connect("mongodb://localhost:27017/reliefsphere");
  const Requirement = require("../models/requirementModel");
  const now = new Date();

  const res = await Requirement.updateMany(
    {
      status: { $in: ["open", "pending"] },
      $or: [
        { requiredBefore: { $ne: null, $lt: now } },
        { expiresAt: { $ne: null, $lt: now } },
      ],
    },
    { status: "expired" }
  );

  console.log("Expired requirements updated:", res.modifiedCount);
  const allReqs = await Requirement.find().lean();
  console.log("=== CURRENT REQUIREMENTS STATUS ===");
  allReqs.forEach((r) =>
    console.log(
      ` - [${r.status.toUpperCase()}] "${r.title}" (Needed: ${r.quantity} ${r.unit}, Deadline: ${
        r.requiredBefore ? r.requiredBefore.toISOString().slice(0, 10) : "none"
      })`
    )
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
