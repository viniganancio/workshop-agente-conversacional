# 🚀 Introdução ao Workshop

Bem-vindo ao Workshop Agente Conversacional! Um workshop hands-on para criar aplicações de IA conversacional modernas.

![Workshop](https://img.shields.io/badge/Workshop-Agente%20Conversacional-blue)
![Nível](https://img.shields.io/badge/Nível-Intermediário-orange)
![Duração](https://img.shields.io/badge/Duração-4--6%20horas-green)

## 🎯 O que você vai construir

Ao final deste workshop, você terá uma aplicação completa de **conversa por voz** que:

```{mermaid}
graph TB
    A[👤 Usuário fala] --> B[🎤 Captura de áudio]
    B --> C[📝 Transcrição STT]
    C --> D[🤖 IA gera resposta]
    D --> E[🔊 Síntese de voz TTS]
    E --> F[🎵 Reprodução automática]
    F --> A

    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style F fill:#e8f5e8
```

### ✨ Funcionalidades Implementadas

- **🎤 Reconhecimento de Voz**: Transcrição em tempo real com Deepgram
- **🧠 IA Conversacional**: Respostas inteligentes com AWS Bedrock Claude
- **🔊 Síntese de Voz**: Audio natural com ElevenLabs
- **💬 Interface Moderna**: React + TypeScript + Tailwind CSS
- **⚡ Tempo Real**: Comunicação WebSocket bidirecional

## 🎓 Quem deveria fazer este workshop?

### 👨‍💻 Desenvolvedor Ideal
- **Experiência**: JavaScript/TypeScript intermediário
- **React**: Conhecimento básico de hooks e componentes
- **Node.js**: Experiência com APIs e servidores
- **APIs**: Familiaridade com integração de APIs externas

### 📚 O que você precisa saber antes

```{admonition} Pré-requisitos Técnicos
:class: info

**Essenciais:**
- JavaScript ES6+ e TypeScript
- React Hooks (useState, useEffect, useRef)
- Node.js e npm/yarn
- Conceitos de WebSocket
- APIs REST básicas

**Recomendados:**
- Web Audio API (vamos ensinar!)
- AWS básico
- Docker (opcional)
```

## 🎯 Objetivos de Aprendizado

Ao completar este workshop, você será capaz de:

### 🔧 Técnico
1. **Integrar múltiplas APIs de IA** (Deepgram, AWS Bedrock, ElevenLabs)
2. **Processar áudio em tempo real** com Web Audio API
3. **Implementar comunicação WebSocket** para streaming
4. **Construir interfaces conversacionais** modernas
5. **Gerenciar estado complexo** em aplicações React

### 🧠 Conceitual
1. **Arquitetura de aplicações de IA** conversacional
2. **Pipeline STT → IA → TTS** completo
3. **Padrões de design** para interfaces de chat
4. **Tratamento de erro** em sistemas distribuídos
5. **Otimização de performance** para tempo real

### 🚀 Prático
1. **Configurar ambientes** de desenvolvimento
2. **Integrar com serviços de IA** em nuvem
3. **Debugar problemas** de áudio e rede
4. **Implementar features** avançadas
5. **Deployar aplicações** completas

## 🗺️ Jornada do Workshop

### 📈 Progressão de Conhecimento

```{mermaid}
graph LR
    A[🌟 Introdução] --> B[⚙️ Setup]
    B --> C[🎤 Etapa 01<br/>STT Básico]
    C --> D[🤖 Etapa 02<br/>+ IA]
    D --> E[🎵 Etapa 03<br/>+ TTS]
    E --> F[🏆 Challenge<br/>Extensões]

    style A fill:#e3f2fd
    style B fill:#f1f8e9
    style C fill:#fff3e0
    style D fill:#fce4ec
    style E fill:#f3e5f5
    style F fill:#fffde7
```

### ⏱️ Cronograma Sugerido

| Etapa | Duração | Descrição |
|-------|---------|-----------|
| **Introdução** | 15 min | Visão geral e objetivos |
| **Getting Started** | 15 min | Setup e configuração de contas |
| **Etapa 01** | 15 min | Transcrição básica com Deepgram |
| **Etapa 02** | 15 min | IA conversacional com Claude |
| **Etapa 03** | 15 min | TTS completo com ElevenLabs |
| **Challenge** | 5 min | Extensões e melhorias |
| **Wrap-up** | 10 min | Revisão e próximos passos |

## 🎨 Arquitetura Final

Ao final do workshop, você terá construído esta arquitetura:

```{mermaid}
graph TB
    subgraph "🖥️ Frontend (React + TypeScript)"
        A[🎤 AudioRecorder] --> B[📡 WebSocket Client]
        B --> C[💬 Chat Interface]
        C --> D[🔊 Audio Player]
    end

    subgraph "🌐 Backend (Node.js + TypeScript)"
        E[📡 WebSocket Server] --> F[🎵 Audio Processing]
        F --> G[📝 Deepgram STT]
        F --> H[🤖 AWS Bedrock Claude]
        F --> I[🔊 ElevenLabs TTS]
    end

    B <--> E

    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style G fill:#fff3e0
    style H fill:#fce4ec
    style I fill:#e8f5e8
```

## 💡 Conceitos-Chave

### 🔊 Web Audio API
- **AudioContext**: Grafo de processamento de áudio
- **ScriptProcessorNode**: Processamento PCM em tempo real
- **MediaStream**: Captura de microfone

### 🌐 WebSocket Real-time
- **Comunicação bidirecional** para streaming
- **Event handling** tipado
- **Reconexão automática**

### 🤖 APIs de IA Modernas
- **Speech-to-Text**: Conversão áudio → texto
- **Large Language Models**: Geração de respostas
- **Text-to-Speech**: Conversão texto → áudio

### ⚡ Performance em Tempo Real
- **Latência baixa** (< 500ms end-to-end)
- **Processamento assíncrono**
- **Buffer management**

## 🎉 Por que este Workshop?

### 🔥 Tecnologias Modernas
- **Cutting-edge**: APIs de IA mais recentes
- **Production-ready**: Padrões industriais
- **Escalável**: Arquitetura robusta

### 🎯 Projeto Real
- **Funcional**: Aplicação completa
- **Útil**: Base para projetos reais
- **Extensível**: Fácil de expandir

### 📚 Aprendizado Hands-on
- **Prático**: Código real, não teoria
- **Progressivo**: Do simples ao complexo
- **Guided**: Suporte durante todo processo

---

## 🚀 Pronto para começar?

```{admonition} Próximo Passo
:class: tip

Agora que você entende o que vamos construir, vamos configurar seu ambiente de desenvolvimento!

➡️ **Continue para**: [Getting Started](../getting-started/index.md)
```

---

**🎯 Lembre-se**: Este é um workshop hands-on. Prepare-se para codar, experimentar e se divertir construindo tecnologia de ponta! 🚀