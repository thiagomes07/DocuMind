import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Security
  passwordPepper: process.env.PASSWORD_PEPPER,

  // Limits
  maxDocumentsPerUser: parseInt(process.env.MAX_DOCUMENTS_PER_USER || '5', 10),
  maxTokensPerUser: parseInt(process.env.MAX_TOKENS_PER_USER || '10000', 10),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),

  // CORS
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Rate Limiting
  throttleTTL: 60000, // 1 minute in ms
  throttleLimit: 30,  // requests per TTL
  
  uploadThrottleTTL: 600000, // 10 minutes in ms
  uploadThrottleLimit: 3,     // uploads per TTL
}));