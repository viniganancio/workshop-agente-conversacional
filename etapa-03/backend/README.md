# 🖥️ Backend - Workshop Agente Conversacional

Servidor Node.js + TypeScript que orquestra a comunicação entre frontend e múltiplas APIs de IA para criar uma experiência conversacional completa.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Express](https://img.shields.io/badge/Express-4.18.2-black)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.5-white)

## 🚀 Tecnologias e Integrações

### Core Stack
- **Node.js + TypeScript** - Runtime com tipagem estática
- **Express.js** - Framework web minimalista
- **Socket.io** - WebSocket para comunicação em tempo real

### Integrações de IA
- **Deepgram SDK** - Speech-to-Text em tempo real
- **AWS Bedrock** - Claude Sonnet 4 para IA conversacional
- **ElevenLabs** - Text-to-Speech de alta qualidade

### Segurança e DevEx
- **Helmet** - Headers de segurança
- **CORS** - Controle de acesso entre origens
- **Rate Limiting** - Proteção contra abuso
- **Compression** - Compressão de respostas

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/             # Controladores HTTP
│   │   └── healthController.ts  # Health checks e status
│   ├── middleware/              # Middlewares customizados
│   │   └── security.ts          # Segurança e validação
│   ├── services/                # Lógica de negócio
│   │   ├── DeepgramService.ts   # Integração Deepgram STT
│   │   ├── BedrockService.ts    # Integração AWS Bedrock Claude
│   │   ├── ElevenLabsService.ts # Integração ElevenLabs TTS
│   │   └── SocketService.ts     # Gerenciamento WebSocket
│   ├── types/                   # Definições TypeScript
│   │   └── index.ts             # Tipos compartilhados
│   ├── utils/                   # Utilitários
│   │   ├── config.ts            # Configurações da aplicação
│   │   └── logger.ts            # Sistema de logging
│   └── server.ts                # Servidor principal
├── dist/                        # Build compilado
├── package.json
└── tsconfig.json
```

## ⚡ Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start

# Type checking
npm run type-check

# Limpar build
npm run clean
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# AWS Bedrock Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL=eleven_multilingual_v2

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## 🎯 Serviços Principais

### DeepgramService
Serviço para transcrição em tempo real:
- **Streaming STT** com resultados intermediários
- **Configuração pt-BR** otimizada
- **Tratamento de erros** robusto
- **Teste de conectividade** automático

```typescript
class DeepgramService {
  async transcribeAudio(audioChunk: Buffer): Promise<TranscriptionResult>
  async testConnection(): Promise<boolean>
}
```

### BedrockService
Serviço para IA conversacional:
- **Claude Sonnet 4** via AWS Bedrock
- **Contexto conversacional** mantido
- **System prompts** customizáveis
- **Rate limiting** interno

```typescript
class BedrockService {
  async generateResponse(userMessage: string, sessionId?: string): Promise<AIResponse>
  async testConnection(): Promise<boolean>
  clearConversation(sessionId: string): void
}
```

### ElevenLabsService
Serviço para síntese de voz:
- **Voz natural** em português
- **Streaming de áudio** otimizado
- **Configurações de voz** customizáveis
- **Base64 encoding** para transmissão

```typescript
class ElevenLabsService {
  async generateSpeech(text: string, sessionId?: string): Promise<TTSResponse>
  async testConnection(): Promise<boolean>
  async getAvailableVoices(): Promise<any[]>
}
```

### SocketService
Orquestrador da comunicação WebSocket:
- **Eventos tipados** para comunicação
- **Pipeline completo** STT → AI → TTS
- **Gestão de sessões** por socket
- **Error handling** centralizado

## 🌐 API WebSocket

### Eventos Recebidos do Frontend

#### `start_recording`
Inicia uma nova sessão de gravação
```typescript
socket.on('start_recording', () => {
  // Prepara serviços para nova sessão
})
```

#### `audio_chunk`
Processa chunk de áudio
```typescript
socket.on('audio_chunk', (audioData: ArrayBuffer) => {
  // audioData → Deepgram → transcription event
})
```

#### `stop_recording`
Finaliza sessão de gravação
```typescript
socket.on('stop_recording', () => {
  // Limpa recursos e finaliza processamento
})
```

### Eventos Enviados para o Frontend

#### `transcription`
Resultado da transcrição
```typescript
socket.emit('transcription', {
  text: string,
  confidence: number,
  isInterim: boolean,
  timestamp: number
})
```

#### `ai_response`
Resposta da IA
```typescript
socket.emit('ai_response', {
  text: string,
  timestamp: number,
  confidence?: number
})
```

#### `tts_audio`
Áudio sintetizado
```typescript
socket.emit('tts_audio', {
  audioData: string, // Base64
  text: string,
  timestamp: number,
  voiceId: string,
  format: string
})
```

#### `error`
Erros do sistema
```typescript
socket.emit('error', {
  message: string,
  code?: string,
  timestamp: number
})
```

## 🔒 Segurança

### Middleware de Segurança
- **Helmet** - Headers de segurança HTTP
- **Rate Limiting** - 100 requests por 15 minutos
- **CORS** - Configurado para frontend específico
- **Request Logging** - Logs estruturados

### Validação
- **Audio chunk validation** - Tamanho e formato
- **Session management** - Limpeza automática
- **Error sanitization** - Não exposição de detalhes internos

## 📊 Logging e Monitoramento

### Sistema de Logs
```typescript
logger.info('🚀 Server running', { port, environment })
logger.error('Failed to process audio', { error, sessionId })
```

### Health Checks
```bash
GET /health      # Status básico do servidor
GET /ready       # Readiness check com teste de APIs
GET /api/status  # Status detalhado com configurações
```

## 🔄 Fluxo de Dados

```
Frontend Audio → WebSocket → Deepgram → Transcription
                                ↓
Frontend ← TTS Audio ← ElevenLabs ← AI Response ← Bedrock Claude
```

### Pipeline Detalhado
1. **Audio Capture**: Frontend envia chunks de áudio
2. **STT Processing**: Deepgram processa e retorna transcrição
3. **AI Processing**: Claude gera resposta inteligente
4. **TTS Processing**: ElevenLabs converte resposta em áudio
5. **Audio Playback**: Frontend reproduz áudio da resposta

## 🚀 Deploy

### Preparação para Produção
```bash
# Build
npm run build

# Verificar tipos
npm run type-check

# Executar
npm start
```

### Variáveis de Ambiente Produção
- Usar secrets management para API keys
- Configurar CORS_ORIGIN para domínio de produção
- Ajustar rate limits conforme necessário
- Configurar logs para agregação

### Docker (exemplo)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔍 Debugging

### Logs Estruturados
```typescript
logger.info('🎤 Audio chunk received', {
  size: audioChunk.length,
  sessionId
})

logger.info('🤖 Claude response generated', {
  responseLength: response.text.length,
  sessionId
})
```

### Error Handling
- **Graceful degradation** para falhas de API
- **Circuit breaker pattern** para serviços externos
- **Retry logic** com backoff exponencial

## 🧪 Testes

### Health Checks Automáticos
- **Deepgram**: Teste de conectividade na inicialização
- **AWS Bedrock**: Validação de credenciais
- **ElevenLabs**: Verificação de API key

### Monitoramento
- **Memory usage** tracking
- **Response times** para cada serviço
- **Error rates** por endpoint

---

**Arquitetura robusta e escalável para aplicações de IA conversacional**