import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    // Ensure retryWrites=false is set for deployments that do not support retryable writes
    let parsedUri = env.MONGO_URI;
    if (!parsedUri.includes('retryWrites=')) {
      const separator = parsedUri.includes('?') ? '&' : '?';
      parsedUri += `${separator}retryWrites=false`;
    }

    const conn = await mongoose.connect(parsedUri, {
      retryWrites: false
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:');

    if (
      env.MONGO_URI.startsWith('mongodb+srv://') &&
      (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.syscall === 'querySrv')
    ) {
      console.error(
        '\n[DNS SRV Resolution Error]\n' +
        'It looks like your network or DNS is blocking the SRV lookup for MongoDB Atlas.\n' +
        'As a workaround, please try switching the MONGO_URI in your .env file to the standard connection string format:\n' +
        'mongodb://<username>:<password>@cluster0-shard-00-00.xxx.mongodb.net:27017,.../?ssl=true&replicaSet=...&authSource=admin\n' +
        '(You can get this string from Atlas by clicking Connect -> Connect your application -> Choose Node.js v2.2.12 or earlier)\n'
      );
    } else {
      console.error(error);
    }

    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to db');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error: ', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});