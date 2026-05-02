# Meta Ads MCP (Node.js) - Guia de Configuração

Este repositório agora contém a versão **Node.js/TypeScript** do servidor Meta Ads MCP, ideal para deploy na **Vercel**. 

*Nota: Repositório oficial movido para allysonassuncao/mcp-meta-ads*

## 🚀 Como começar localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`:
- `META_ACCESS_TOKEN`: Seu token de acesso do Meta Marketing API.
- `META_APP_ID`: Seu App ID do Meta.
- `META_APP_SECRET`: Seu App Secret (necessário para `appsecret_proof`).

### 3. Rodar em modo desenvolvimento
```bash
npm run dev
```

## ☁️ Deploy na Vercel

Este projeto já está configurado para a Vercel com o arquivo `vercel.json`.

1. Instale a Vercel CLI: `npm i -g vercel`
2. Execute o comando: `vercel`
3. Siga as instruções no terminal para vincular o projeto e fazer o deploy.
4. No painel da Vercel, adicione as variáveis de ambiente (`META_ACCESS_TOKEN`, etc).

Sua URL de MCP será algo como: `https://seu-projeto.vercel.app/mcp`

## 📋 Diferenciais desta versão
- **Deploy Serverless**: Pronto para rodar em Vercel Functions.
- **TypeScript**: Maior segurança no desenvolvimento.
- **Performance**: Baixa latência e inicialização rápida.

---
Para documentação detalhada das ferramentas, veja o [README.md](README.md) principal.
