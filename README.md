# 🎤 Workshop Agente Conversacional

Um workshop demonstrativo para criação de um agente conversacional que captura áudio em tempo real, transcreve usando Deepgram e exibe os resultados de forma elegante.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Deepgram](https://img.shields.io/badge/Deepgram-API-purple)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🚀 Sobre o Projeto

Este projeto demonstra como criar um agente conversacional moderno que:

- **Captura áudio** em tempo real do microfone do usuário
- **Transcreve automaticamente** usando a API do Deepgram
- **Exibe resultados** de forma elegante e responsiva
- **Funciona em tempo real** com WebSocket para comunicação instantânea

### 🎯 Objetivos do Workshop

1. Aprender a capturar áudio no navegador usando MediaRecorder API
2. Implementar comunicação em tempo real com WebSocket
3. Integrar com API de transcrição do Deepgram
4. Criar uma interface moderna com React e Tailwind CSS
5. Configurar um servidor Node.js para processar áudio

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca para construção da interface
- **Vite** - Ferramenta de build rápida e moderna
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **Socket.io Client** - Cliente WebSocket para comunicação em tempo real
- **Lucide React** - Ícones modernos e consistentes

### Backend
- **Node.js** - Runtime JavaScript para servidor
- **Express.js** - Framework web minimalista
- **Socket.io** - Biblioteca WebSocket para comunicação bidirecional
- **Deepgram SDK** - SDK oficial para integração com API de transcrição
- **dotenv** - Gerenciamento de variáveis de ambiente
- **CORS** - Middleware para controle de acesso entre origens

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Conta no Deepgram** ([criar conta gratuita](https://deepgram.com))
- **Navegador moderno** com suporte a MediaRecorder API

## 📦 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/viniganancio/workshop-agente-conversacional.git
   cd workshop-agente-conversacional
   ```

2. **Instale as dependências do frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Instale as dependências do backend**
   ```bash
   cd ../backend
   npm install
   ```

## ⚙️ Configuração

### 1. Configuração do Backend

Crie um arquivo `.env` na pasta `backend`:

```env
DEEPGRAM_API_KEY=sua_chave_api_deepgram_aqui
PORT=3001
CORS_ORIGIN=http://localhost:8080
NODE_ENV=development
```

### 2. Obtenha sua chave da API Deepgram

1. Acesse [Deepgram Console](https://console.deepgram.com)
2. Crie uma conta ou faça login
3. Navegue até **API Keys**
4. Crie uma nova chave e copie para o arquivo `.env`

### 3. Configuração do Frontend

O frontend já está configurado para se conectar com o backend na porta 3001.

## 🚀 Como Usar

### 1. Inicie o Backend
```bash
cd backend
npm run dev
```

### 2. Inicie o Frontend
```bash
cd frontend
npm run dev
```

### 3. Acesse a aplicação
Abra seu navegador e acesse: `http://localhost:8080`

### 4. Teste a funcionalidade
1. Clique no botão **"Iniciar Gravação"**
2. Permita o acesso ao microfone quando solicitado
3. Fale normalmente - a transcrição aparecerá em tempo real
4. Clique em **"Parar Gravação"** para finalizar

## 📁 Estrutura do Projeto

```
workshop-agente-conversacional/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   └── ui/          # Componentes de UI (Radix)
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilitários e configurações
│   │   ├── App.tsx          # Componente principal
│   │   └── main.tsx         # Ponto de entrada
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Servidor Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores de rota
│   │   ├── services/        # Lógica de negócio
│   │   └── server.js        # Servidor principal
│   ├── package.json
│   └── .env.example
├── README.md
└── CLAUDE.md                # Instruções para o Claude Code
```

## ✨ Funcionalidades

### Implementadas
- [x] Interface moderna e responsiva
- [x] Estrutura básica do projeto
- [x] Configuração do ambiente de desenvolvimento

### Em Desenvolvimento
- [ ] 🎤 Captura de áudio do microfone
- [ ] 🔗 Conexão WebSocket frontend-backend
- [ ] 🖥️ Servidor Node.js com Express e Socket.io
- [ ] 🎯 Integração com API Deepgram
- [ ] 📝 Exibição de transcrição em tempo real
- [ ] 🎨 Animações e feedback visual
- [ ] ⚠️ Tratamento de erros e estados de loading

### Futuras Melhorias
- [ ] 🌙 Modo escuro/claro
- [ ] 📱 Otimização para dispositivos móveis
- [ ] 💾 Histórico de transcrições
- [ ] 🔄 Reconexão automática WebSocket
- [ ] 🎵 Visualização de áudio durante gravação
- [ ] 🌍 Suporte a múltiplos idiomas
- [ ] 📊 Métricas de qualidade da transcrição

## 🗓️ Roadmap

### Fase 1: Fundação (Atual)
- ✅ Setup inicial do projeto
- ✅ Estrutura de pastas e configurações
- ⏳ Componente de gravação de áudio

### Fase 2: Backend e Integração
- ⏳ Servidor Node.js com Socket.io
- ⏳ Integração com Deepgram SDK
- ⏳ Processamento de áudio em streaming

### Fase 3: Interface e UX
- ⏳ Componente de exibição de transcrição
- ⏳ Estados de loading e erro
- ⏳ Animações e transições

### Fase 4: Melhorias e Otimização
- ⏳ Tratamento avançado de erros
- ⏳ Otimizações de performance
- ⏳ Testes automatizados

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um **Pull Request**

### 🏷️ Convenções de Commit

Usamos o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
feat: adiciona componente de gravação de áudio
fix: corrige erro de conexão WebSocket
docs: atualiza README com instruções de instalação
style: ajusta formatação do código
refactor: refatora serviço de transcrição
test: adiciona testes para componente AudioRecorder
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

Se você tem alguma dúvida ou precisa de ajuda:

- 🐛 **Issues**: Para bugs e problemas técnicos
- 💡 **Discussions**: Para ideias e discussões gerais
- 📧 **Email**: [contato@viniganancio.dev](mailto:contato@viniganancio.dev)

---

<div align="center">

**Feito com ❤️ por Vini Ganancio para a comunidade de desenvolvedores**

[⬆ Voltar ao topo](#-workshop-agente-conversacional)

</div>