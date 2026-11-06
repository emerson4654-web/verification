# Site de Verificação EB — somente o site

Este pacote contém apenas o site e seu servidor Node.js. Não inclui o bot Discord.

## Arquivos

Todos os arquivos ficam diretamente na raiz, sem subpastas.

## Instalação na Hize Cloud

1. Envie este ZIP para um serviço Node.js.
2. Use Node.js 20 ou superior.
3. Comando de instalação: `npm install`
4. Comando de inicialização: `npm start`
5. Configure `PORT` com a porta fornecida pela Hize (se a hospedagem preencher automaticamente, não precisa alterar).
6. Configure `DATA_FILE` para um caminho persistente, caso a Hize ofereça armazenamento persistente.
7. Abra `/health` para conferir se o servidor está ativo.

## Integração com o bot Discord

Este pacote é somente o site. O fluxo de cadastro recebe um token individual criado pelo bot. Para o link `/cadastro/TOKEN` funcionar, o bot e o site precisam ler e gravar o mesmo armazenamento `eb-suite-data.json` em um volume persistente compartilhado.

Se bot e site forem hospedados em serviços separados sem armazenamento compartilhado, o cadastro não vai localizar os tokens. Nesse cenário, é necessário adaptar a integração para o bot enviar os tokens ao site por uma API autenticada ou usar um banco de dados compartilhado. Não use dois arquivos JSON locais separados esperando que sincronizem.

O site confirma o código na biografia pública do Roblox. Ele nunca solicita senha do Roblox.

## Rotas

- `/` — página inicial do portal.
- `/cadastro/TOKEN` — formulário de cadastro iniciado pelo bot.
- `/health` — verificação de disponibilidade.
- `/transcripts/ID` — visualização de transcript salvo pelo sistema de tickets.

Os transcripts também dependem dos registros estarem no mesmo armazenamento utilizado pelo bot.
