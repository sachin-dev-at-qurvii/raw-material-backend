const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

const connectDB = async()=>{
    const connection = await mongoose.connect(MONGO_URI);
    console.log(`Mongodb connection at ${connection.connection.host}`);
}

module.exports = connectDB;