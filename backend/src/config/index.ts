/**
 * Configuration Barrel Export
 * Centralizes all configuration imports for easy module setup
 */
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import storageConfig from './storage.config';
import llmConfig from './llm.config';

export const configModules = [
  appConfig,
  databaseConfig,
  jwtConfig,
  storageConfig,
  llmConfig,
];

export { appConfig, databaseConfig, jwtConfig, storageConfig, llmConfig };