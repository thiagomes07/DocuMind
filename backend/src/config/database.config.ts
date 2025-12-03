import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  
  // Connection Pool Settings (for production optimization)
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  
  // Query Timeout
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10), // 30s
  
  // Connection Timeout
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10), // 10s
  
  // Logging
  logQueries: process.env.DB_LOG_QUERIES === 'true',
}));