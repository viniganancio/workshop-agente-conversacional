import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { serverConfig } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface AIResponse {
  text: string;
  timestamp: number;
  confidence?: number;
}

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export class BedrockService {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private conversations: Map<string, ConversationContext> = new Map();
  private systemPrompt: string;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: serverConfig.awsRegion,
      credentials: {
        accessKeyId: serverConfig.awsAccessKeyId,
        secretAccessKey: serverConfig.awsSecretAccessKey,
      },
    });
    this.modelId = serverConfig.bedrockModelId;
    this.systemPrompt = this.loadSystemPrompt();
  }

  private loadSystemPrompt(): string {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const promptPath = join(__dirname, '..', 'prompts', 'system-prompt.txt');

      const prompt = readFileSync(promptPath, 'utf-8');
      logger.info('📝 System prompt loaded successfully');
      return prompt.trim();
    } catch (error) {
      logger.error('Failed to load system prompt, using fallback', { error });
      return 'Você é um assistente conversacional inteligente em português brasileiro. Responda de forma natural, útil e concisa às mensagens do usuário. Mantenha um tom amigável e profissional.';
    }
  }

  async generateResponse(
    userMessage: string,
    sessionId: string = 'default'
  ): Promise<AIResponse> {
    try {
      // Get or create conversation context
      let context = this.conversations.get(sessionId);
      if (!context) {
        context = { messages: [] };
        this.conversations.set(sessionId, context);
      }

      // Add user message to context
      context.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      });

      // Use the loaded system prompt

      const messages = context.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        system: this.systemPrompt,
        messages: messages,
        temperature: 0.7,
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify(requestBody),
        contentType: 'application/json',
        accept: 'application/json',
      });

      logger.info(`🤖 Sending request to Bedrock Claude: "${userMessage}"`);

      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
        throw new Error('Invalid response format from Bedrock');
      }

      const aiResponseText = responseBody.content[0].text;

      // Add AI response to context
      context.messages.push({
        role: 'assistant',
        content: aiResponseText,
        timestamp: Date.now(),
      });

      // Keep conversation history manageable (last 10 messages)
      if (context.messages.length > 10) {
        context.messages = context.messages.slice(-10);
      }

      const aiResponse: AIResponse = {
        text: aiResponseText,
        timestamp: Date.now(),
      };

      logger.info(`🤖 Claude response: "${aiResponseText}"`);

      return aiResponse;
    } catch (error: any) {
      logger.error('Error generating AI response', {
        error: error.message || error,
        stack: error.stack,
        userMessage,
        sessionId
      });

      // Handle specific AWS Bedrock errors
      if (error.name === 'AccessDeniedException') {
        throw new Error('Acesso negado ao Bedrock. Verifique as credenciais AWS.');
      }

      if (error.name === 'ModelNotReadyException') {
        throw new Error('Modelo Claude não está pronto. Tente novamente em alguns instantes.');
      }

      if (error.name === 'ThrottlingException') {
        throw new Error('Limite de requisições excedido. Aguarde um momento e tente novamente.');
      }

      if (error.name === 'ValidationException') {
        throw new Error('Erro de validação na requisição para o Claude.');
      }

      if (error.code === 'NetworkingError') {
        throw new Error('Erro de conexão com o serviço AWS Bedrock.');
      }

      // Generic error message for unknown errors
      throw new Error('Erro interno do serviço de IA. Tente novamente.');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test to verify Bedrock connectivity without generating a full response
      const requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.1,
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify(requestBody),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const isSuccessful = !!response.body;

      logger.info('🔍 Bedrock connection test', { successful: isSuccessful });
      return isSuccessful;
    } catch (error: any) {
      logger.error('Bedrock connection test failed', {
        error: error.message || error,
        errorName: error.name,
        errorCode: error.code
      });
      return false;
    }
  }

  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
    logger.info(`🗑️ Cleared conversation for session: ${sessionId}`);
  }

  getConversationHistory(sessionId: string): ConversationContext | null {
    return this.conversations.get(sessionId) || null;
  }

  reloadSystemPrompt(): void {
    this.systemPrompt = this.loadSystemPrompt();
    logger.info('🔄 System prompt reloaded');
  }

  getCurrentSystemPrompt(): string {
    return this.systemPrompt;
  }
}