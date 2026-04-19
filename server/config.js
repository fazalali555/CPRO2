import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  app: {
    name: 'Clerk Pro by Fazal Ali',
    version: '0.0.1',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3003', 'http://localhost:5173'\],
    credentials: true,
  },
  
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100,
  },
};
