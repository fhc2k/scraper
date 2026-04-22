const mongoose = require('mongoose');
require('dotenv').config();

async function testMongo() {
    const uri = process.env.DATABASE_URL;
    
    if (!uri) {
        console.error("❌ ERROR: DATABASE_URL not found in .env");
        return;
    }

    console.log("--- Testing MongoDB Connection ---");
    // Show only the host for security
    try {
        const host = uri.split('@')[1] || uri;
        console.log(`Connecting to: ${host}`);
    } catch (e) {}

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 // Fail faster for the test
        });
        console.log("✅ SUCCESS: Connected to MongoDB!");
        
        // Final check: list collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections in the database.`);
        
        await mongoose.disconnect();
    } catch (e) {
        console.error("❌ FAILED: Could not connect to MongoDB.");
        console.error("Error Detail:", e.message);
        console.log("\nPossible causes:");
        console.log("1. The database server on Railway is down.");
        console.log("2. Your local IP is being blocked (Railway Proxy usually allows all).");
        console.log("3. Username or password in DATABASE_URL are incorrect.");
    }
}

testMongo();
