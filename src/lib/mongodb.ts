import mongoose from 'mongoose';

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://snasir2194:root@cluster0.tvbae.mongodb.net/sms_campaign';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

let cached: MongooseCache = global.mongoose as MongooseCache;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => mongooseInstance.connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
