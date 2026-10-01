import dns from "dns";
import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';


dns.setServers(['1.1.1.1', '8.8.8.8'])
const start = async (): Promise<void> => {
  await connectDB();
  const server = app.listen(env.PORT, () => console.log(`Server listening on port ${env.PORT} (${env.NODE_ENV})`));

  const shutdown = (signal: string): void => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      void mongoose.connection.close().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
