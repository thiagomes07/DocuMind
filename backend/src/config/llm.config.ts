import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  // AWS Bedrock
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

  // Model Configuration
  modelId:
    process.env.BEDROCK_MODEL_ID ||
    'anthropic.claude-3-haiku-20240307-v1:0',

  // Model Parameters
  parameters: {
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    topP: parseFloat(process.env.LLM_TOP_P || '0.9'),
  },

  // Prompt Configuration
  systemPrompt:
    'Você é um assistente de análise de documentos. Responda em português de forma clara e objetiva.',

  // Token Limits
  maxTokensPerUser: parseInt(process.env.MAX_TOKENS_PER_USER || '10000', 10),
  
  // Question Constraints
  maxQuestionLength: parseInt(process.env.MAX_QUESTION_LENGTH || '500', 10),
  
  // Context Window
  maxContextLength: parseInt(process.env.MAX_CONTEXT_LENGTH || '100000', 10), // Claude 3 has 200k context

  // Timeout
  requestTimeout: parseInt(process.env.LLM_REQUEST_TIMEOUT || '30000', 10), // 30 seconds
}));