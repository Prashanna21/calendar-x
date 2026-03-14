const mongoose = require("mongoose");

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment");
  }

  await mongoose.connect(uri, {
    dbName: "calendarx",
    bufferCommands: false,
  });

  await mongoose.connection.db.admin().ping();
  console.log("✅ MongoDB connected and ping successful");
}

testConnection()
  .catch((error) => {
    console.error("❌ MongoDB connection test failed");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
