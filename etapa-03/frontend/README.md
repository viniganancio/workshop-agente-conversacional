# 🎨 Frontend - Workshop Agente Conversacional

Interface moderna e responsiva para o agente conversacional inteligente, construída com React + TypeScript e Vite.

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.1-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.11-cyan)

## 🚀 Tecnologias Principais

- **React 18.3.1** - Framework para construção da interface
- **TypeScript** - Tipagem estática para maior robustez
- **Vite** - Build tool ultra-rápido com HMR
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **Socket.io Client** - Comunicação WebSocket em tempo real

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/              # Componentes da aplicação
│   │   ├── AudioRecorder.tsx    # Componente de gravação de áudio
│   │   ├── TranscriptionDisplay.tsx  # Exibição de transcrições
│   │   └── ui/                  # Componentes de UI (Radix)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── progress.tsx
│   │       └── ... (40+ componentes)
│   ├── hooks/                   # Custom hooks
│   │   ├── useWebSocket.ts      # Hook para comunicação WebSocket
│   │   ├── useAudioPlayer.ts    # Hook para reprodução de áudio TTS
│   │   └── use-*.ts             # Hooks utilitários
│   ├── lib/
│   │   └── utils.ts             # Utilitários e helpers
│   ├── App.tsx                  # Componente principal
│   └── main.tsx                 # Ponto de entrada
├── config/                      # Configurações
│   ├── eslint.config.js
│   └── tsconfig*.json
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## ⚡ Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Linting
npm run lint
npm run lint:fix
```

## 🎯 Componentes Principais

### AudioRecorder
Componente responsável pela captura e processamento de áudio:
- **Gravação em tempo real** com Web Audio API (AudioContext)
- **Processamento PCM** direto com ScriptProcessorNode
- **Feedback visual** com animações durante gravação
- **Tratamento de permissões** de microfone
- **Estados visuais** (idle, recording, processing, error)
- **Streaming de áudio** via WebSocket

### TranscriptionDisplay
Componente para exibição da conversa:
- **Transcrições em tempo real** com resultados intermediários e finais
- **Respostas da IA** com formatação especial
- **Player de áudio integrado** para TTS
- **Histórico completo** da conversa
- **Animações suaves** para novos conteúdos

### useWebSocket Hook
Hook customizado para comunicação WebSocket:
- **Conexão automática** com o backend
- **Reconexão automática** em caso de perda
- **Eventos tipados** para transcription, ai_response, tts_audio
- **Status de conexão** em tempo real

### useAudioPlayer Hook
Hook para reprodução de áudio TTS:
- **Reprodução de áudio base64**
- **Controle de estado** (playing, stopped)
- **Limpeza automática** de recursos
- **Tratamento de erros** de reprodução

## 🎨 Sistema de Design

### Cores e Temas
- **Tema claro** com gradientes suaves
- **Paleta de cores** baseada no Tailwind CSS
- **Componentes consistentes** com Radix UI
- **Acessibilidade** em primeiro lugar

### Animações
- **Pulse animation** durante gravação
- **Smooth transitions** entre estados
- **Fade in/out** para novos conteúdos
- **Loading states** visuais

## 🔧 Configurações

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
  },
  // ... outras configurações
})
```

### Tailwind Configuration
- **Configuração personalizada** para cores e espaçamentos
- **Plugins** para animações e componentes
- **Responsive design** otimizado

## 🌐 Comunicação com Backend

### WebSocket Events

**Enviados para o backend:**
- `start_recording` - Inicia gravação
- `audio_chunk` - Chunk de áudio para processamento
- `stop_recording` - Para gravação

**Recebidos do backend:**
- `transcription` - Resultado da transcrição
- `ai_response` - Resposta da IA
- `tts_audio` - Áudio sintetizado
- `error` - Erros do servidor

### Tipos TypeScript
```typescript
interface TranscriptionResult {
  text: string;
  confidence: number;
  isInterim: boolean;
  timestamp: number;
}

interface AIResponse {
  text: string;
  timestamp: number;
  confidence?: number;
}

interface TTSResponse {
  audioData: string; // Base64
  text: string;
  timestamp: number;
  voiceId: string;
  format: string;
}
```

## 📱 Responsividade

- **Mobile-first** approach
- **Grid layout** adaptativo
- **Componentes flexíveis** que se ajustam ao tamanho da tela
- **Testes em diferentes devices**

## 🔍 Debugging

### Logs do Console
- **WebSocket events** com timestamps
- **Estado dos componentes** durante desenvolvimento
- **Erros de áudio** com detalhes

### DevTools
- **React DevTools** para debugging de componentes
- **Network tab** para monitorar WebSocket
- **Console** para logs estruturados

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Variáveis de Ambiente
```env
VITE_BACKEND_URL=http://localhost:3001
```

## 🔗 Integração

### Backend URL
Por padrão, o frontend conecta com o backend em `http://localhost:3001`. Para alterar:

1. Ajustar no código ou
2. Usar variável de ambiente `VITE_BACKEND_URL`

### CORS
O backend deve estar configurado para aceitar conexões do frontend na porta 8080.

---

**Desenvolvido com ❤️ usando as melhores práticas de React e TypeScript**