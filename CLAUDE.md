# Gerador de Roteiros de Viagem

## Como rodar
```bash
npm install
npm start
```
O servidor roda na porta **5780** → http://localhost:5780

## Stack
- **Node.js + Express** — servidor web
- **@google/genai** — SDK do Google Gemini (modelo `gemini-2.5-flash`)
- **dotenv** — variáveis de ambiente

## Estrutura
- `server.js` — servidor Express, rota da API, integração Gemini
- `public/` — frontend (formulário estático)
- `roteiros/` — pasta auto-criada onde os HTMLs gerados são salvos (gitignored)
- `.env` — chave da API Gemini (gitignored)

## Fluxo
1. Usuário preenche formulário com dados da viagem
2. `POST /api/gerar-roteiro` envia dados ao Gemini com template HTML
3. Gemini retorna HTML completo preenchido
4. Server salva em `roteiros/{id}.html`
5. Client redireciona para `/roteiro/{id}`

## Idioma
- Toda comunicação e código deve ser em **pt-BR**

## Deploy na VPS

**Servidor:** 155.117.40.112 | **User:** administrator | **Domínio:** roteirocomia.flpautomatik.com

Para atualizar a VPS após alterações locais, rodar **dois comandos**:

**1. Enviar arquivos (da máquina local):**
```bash
rsync -avz --exclude node_modules --exclude .env --exclude .git --exclude roteiros -e ssh ./ administrator@155.117.40.112:/var/www/gerador-roteiros-ia/
```

**2. Reiniciar o app (na VPS via SSH):**
```bash
ssh administrator@155.117.40.112 "cd /var/www/gerador-roteiros-ia && npm install && pm2 restart gerador-roteiros"
```

> O `--exclude .env` protege a config do servidor. O `--exclude roteiros` protege os roteiros já gerados.

## Notas
- A geração pode levar 30-60 segundos (o template é grande)
- Os roteiros são salvos como arquivos HTML estáticos, sem banco de dados
- Usar `@google/genai` (SDK novo), NÃO `@google/generative-ai` (deprecado)
