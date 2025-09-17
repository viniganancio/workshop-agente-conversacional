# 🖥️ Backend - Etapa 01: Transcrição Básica

Servidor Node.js + TypeScript focado na integração com Deepgram para transcrição de áudio em tempo real.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Etapa](https://img.shields.io/badge/Etapa-01-green)

## 🎯 Objetivo desta Etapa

Esta é a **primeira etapa** do workshop, implementando:
- ✅ Servidor WebSocket para receber áudio
- ✅ Integração com Deepgram SDK
- ✅ Transcrição em tempo real
- ✅ Comunicação bidirecional com frontend

## 🚀 Tecnologias

### Core Stack
- **Node.js + TypeScript** - Runtime e tipagem
- **Express.js** - Framework web
- **Socket.io** - WebSocket server

### Integração de IA
- **Deepgram SDK** - Speech-to-Text em tempo real

### Segurança
- **Helmet** - Headers de segurança
- **CORS** - Controle de acesso
- **Rate Limiting** - Proteção básica

## 📁 Estrutura

```
backend/
├── src/
│   ├── controllers/
│   │   └── healthController.ts      # Health checks
│   ├── middleware/
│   │   └── security.ts              # Segurança básica
│   ├── services/
│   │   ├── DeepgramService.ts       # Integração Deepgram
│   │   └── SocketService.ts         # WebSocket management
│   ├── types/
│   │   └── index.ts                 # Tipos TypeScript
│   ├── utils/
│   │   ├── config.ts                # Configurações
│   │   └── logger.ts                # Sistema de log
│   └── server.ts                    # Servidor principal
├── dist/                            # Build compilado
├── package.json
└── tsconfig.json
```

## ⚡ Comandos

```bash
# Instalar dependências
npm install

# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Executar build
npm start

# Type checking
npm run type-check
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:8080
NODE_ENV=development
```

### Deepgram Setup
1. Acesse [Deepgram Console](https://console.deepgram.com)
2. Crie uma conta gratuita
3. Navegue até **API Keys**
4. Crie nova chave e adicione ao `.env`

## 🎤 Serviços Implementados

### DeepgramService
Responsável pela transcrição de áudio:

```typescript
class DeepgramService {
  // Transcreve chunk de áudio
  async transcribeAudio(audioChunk: Buffer): Promise<TranscriptionResult>

  // Testa conectividade
  async testConnection(): Promise<boolean>
}
```

**Características:**
- **Streaming STT** com resultados intermediários
- **Configuração pt-BR** para português brasileiro
- **Error handling** robusto
- **Low latency** otimizado

### SocketService
Gerencia comunicação WebSocket:

```typescript
class SocketService {
  // Processa áudio recebido
  private async handleAudioChunk(socket, audioData)

  // Testa serviços na inicialização
  async testDeepgramConnection(): Promise<boolean>
}
```

**Funcionalidades:**
- **Event handling** tipado
- **Session management** por socket
- **Error propagation** para frontend
- **Graceful shutdown**

## 🌐 API WebSocket

### Eventos Recebidos do Frontend

#### `start_recording`
```typescript
socket.on('start_recording', () => {
  logger.info('🎤 Recording started', { socketId })
})
```

#### `audio_chunk`
```typescript
socket.on('audio_chunk', async (audioData: ArrayBuffer) => {
  const result = await deepgramService.transcribeAudio(buffer)
  socket.emit('transcription', result)
})
```

#### `stop_recording`
```typescript
socket.on('stop_recording', () => {
  logger.info('⏹️ Recording stopped', { socketId })
})
```

### Eventos Enviados para Frontend

#### `transcription`
```typescript
interface TranscriptionResult {
  text: string
  confidence: number
  isInterim: boolean
  timestamp: number
}

socket.emit('transcription', result)
```

#### `error`
```typescript
interface ErrorMessage {
  message: string
  code?: string
  timestamp: number
}

socket.emit('error', errorMessage)
```

## 🔒 Segurança

### Middleware Implementado
```typescript
// Headers de segurança
app.use(helmet())

// CORS configurado
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true
}))

// Rate limiting básico
app.use(rateLimiter) // 100 requests / 15 min
```

### Validações
- **Audio chunk size** - Máximo 1MB por chunk
- **Session management** - Cleanup automático
- **Error sanitization** - Não exposição de detalhes internos

## 📊 Logging

### Sistema de Logs Estruturados
```typescript
// Logs importantes durante operação
logger.info('🎤 Audio chunk received', {
  size: audioChunk.length,
  socketId
})

logger.info('📝 Transcription completed', {
  text: result.text.substring(0, 50),
  confidence: result.confidence,
  socketId
})
```

### Health Checks
```bash
GET /health      # Status básico
GET /ready       # Teste Deepgram incluído
GET /api/status  # Status detalhado
```

## 🔄 Fluxo de Dados

```
Frontend Audio → WebSocket → DeepgramService → Transcription → Frontend
```

### Pipeline Detalhado
1. **Audio Reception**: Frontend envia chunks via WebSocket
2. **Buffer Processing**: Conversão ArrayBuffer → Buffer Node.js
3. **Deepgram STT**: Envio para API de transcrição
4. **Result Processing**: Formatação do resultado
5. **Response**: Envio da transcrição de volta ao frontend

## 🧪 Testes de Conectividade

### Deepgram Test
```typescript
// Executado na inicialização
const deepgramConnected = await socketService.testDeepgramConnection()
if (!deepgramConnected) {
  logger.warn('⚠️ Deepgram connection failed')
}
```

### Audio Processing Test
```bash
# Teste manual via curl
curl -X POST http://localhost:3001/health
```

## 🎓 O que Você Aprende

### 1. WebSocket Server
- Configuração Socket.io
- Event handling tipado
- Binary data processing

### 2. Audio Processing
- Buffer manipulation
- Audio formato conversions
- Streaming data handling

### 3. External API Integration
- Deepgram SDK usage
- Error handling patterns
- Connection testing

### 4. TypeScript Backend
- Service architecture
- Type definitions
- Configuration management

## 🔍 Debug e Troubleshooting

### Logs Importantes
```typescript
// Conexão WebSocket
🔌 Client connected: socket-id

// Processamento de áudio
🎤 Audio chunk received: 1024 bytes

// Resultado Deepgram
📝 Transcription: "olá mundo" (confidence: 0.95)

// Erros
❌ Deepgram error: Invalid audio format
```

### Problemas Comuns

**1. Deepgram API Key Inválida**
```
Error: 401 Unauthorized from Deepgram
```
Solução: Verificar `.env` e validade da chave

**2. Audio Format Issues**
```
Error: Unsupported audio format
```
Solução: Verificar configuração MediaRecorder no frontend

**3. CORS Issues**
```
Error: CORS policy blocked
```
Solução: Verificar `CORS_ORIGIN` no `.env`

## 🚀 Próximos Passos

Esta etapa estabelece a base para:

**Etapa 02**: Adicionar AWS Bedrock Claude para IA conversacional
**Etapa 03**: Incluir ElevenLabs para Text-to-Speech completo

## 🎯 Conceitos-Chave

1. **Real-time Audio**: Streaming e processamento em tempo real
2. **WebSocket Communication**: Comunicação bidirecional eficiente
3. **External API Integration**: Integração robusta com Deepgram
4. **Error Handling**: Tratamento gracioso de falhas
5. **TypeScript Backend**: Tipagem estática para robustez

---

**Fundação sólida para aplicações de transcrição em tempo real**

➡️ **Próxima etapa**: [Etapa 02 - IA Conversacional](../etapa-02/)