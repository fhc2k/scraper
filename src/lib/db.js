import mongoose from 'mongoose';
import crypto from 'crypto';
import CepQuery from '@/models/CepQuery';

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('[DB] Connecting to MongoDB via Mongoose...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[DB] MongoDB Connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Generates a unique fingerprint based on the query form data.
 */
export function generateFingerprint(query) {
  const dataStr = `${query.fecha}|${query.monto.toString()}|${query.referencia}|${query.cuentaBeneficiaria}|${query.emisor}|${query.receptor}`;
  return crypto.createHash('sha256').update(dataStr).digest('hex');
}

/**
 * Finds an existing CEP in the database to act as a cache.
 */
export async function findExistingCEP(query) {
  try {
    await dbConnect();
    
    // 1. Try match by transaction ID if provided
    if (query.id_transaccion) {
      const existing = await CepQuery.findOne({ id_transaccion: query.id_transaccion }).lean();
      if (existing) return existing;
    }

    // 2. Try match by the query parameters fingerprint
    const fingerprint = generateFingerprint(query);
    const existing = await CepQuery.findOne({ fingerprint }).lean();

    return existing;
  } catch (error) {
    console.error('[DB] Error finding existing CEP:', error);
    return null;
  }
}

/**
 * Persists a successful CEP query result to MongoDB.
 */
export async function saveCEP(data) {
  try {
    await dbConnect();
    const fingerprint = generateFingerprint(data);
    console.log('[DB] Saving CEP to MongoDB:', data.id_transaccion, 'Fingerprint:', fingerprint);
    
    const saved = await CepQuery.findOneAndUpdate(
      { fingerprint },
      { 
        ...data,
        monto: data.monto.toString(),
        fingerprint,
        last_sync: Date.now()
      },
      { upsert: true, new: true }
    );

    console.log('[DB] CEP Saved/Updated successfully:', saved._id);
    return saved;
  } catch (error) {
    console.error('[DB] Error saving CEP:', error);
    throw error;
  }
}

export default dbConnect;
