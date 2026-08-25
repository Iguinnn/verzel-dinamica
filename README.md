# Estacionamento Rotativo

Aplicacao full stack para administrar usuarios, setores, reservas, lista de espera e historico de um estacionamento rotativo.

## Escopo

O produto cobre cinco historias:

1. cadastro e listagem de setores;
2. reserva e cancelamento de vagas;
3. ranking de setores por quantidade de reservas;
4. lista de espera com promocao automatica;
5. historico completo das alteracoes de uma reserva.

O sistema possui login por e-mail e senha. Motoristas acessam somente as proprias
reservas e historicos. A fila de cada setor mostra placas mascaradas e permite
que o motorista altere somente a propria entrada. Administradores gerenciam
setores e acessam a visao operacional completa e o ranking.

## Stack acordada

- Monorepo com npm workspaces
- Next.js com App Router e Shadcn UI
- Express com TypeScript
- PostgreSQL com Drizzle ORM

## Estrutura

```text
apps/
  api/       API Express e acesso ao banco
  web/       Interface Next.js e BFF
packages/
  contracts/ Contratos Zod compartilhados
```

## Inicio rapido

```bash
npm install
cp .env.example .env
set -a && source .env && set +a
npm run dev
```

O comando `npm run dev` inicia o PostgreSQL pelo Docker Compose, aguarda o
healthcheck, aplica as migrations pendentes e inicia o frontend e a API no mesmo
terminal. O frontend fica em `http://localhost:3000` e a API em
`http://localhost:3333`.

Carregue o `.env` no shell antes de executar comandos que acessam a API, o BFF,
as migrations, os seeds ou os testes de integracao. O arquivo da raiz concentra
as variaveis usadas pelos dois apps.

O BFF do Next.js consulta o Express por `API_URL` e valida as respostas com o contrato compartilhado.

## Documentacao

- [Modelo relacional em DBML](docs/database.dbml)
- [Plano de trabalho para seis desenvolvedores](docs/work-plan.md)
- [Atribuicoes de terceiros](THIRD_PARTY_NOTICES.md)

## Scripts

```bash
npm run dev
npm run db:up
npm run db:migrate
npm run db:logs
npm run db:down
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run dev:web` e `npm run dev:api` para iniciar os servicos separadamente.

## Lista de espera no backend

As rotas abaixo exigem uma sessao autenticada:

- `POST /v1/sectors/:sectorId/waitlist` cria a reserva `WAITLISTED`, a entrada
  `WAITING` e os eventos de criacao e entrada em uma unica transacao.
- `GET /v1/sectors/:sectorId/waitlist` lista a fila em ordem FIFO, com placas
  mascaradas e a indicacao `isMine`.
- `DELETE /v1/waitlist/:id` registra a saida voluntaria do proprio motorista
  sem apagar o historico.

O cliente nao envia `reservationId`; a API cria a reserva que satisfaz a FK. Ao
cancelar uma reserva ativa, o backend promove atomicamente a primeira entrada
da fila. A cota permanece inalterada quando existe promocao e aumenta em uma
vaga quando a fila esta vazia.

O teste de integracao do repositorio usa o PostgreSQL local:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rotating_parking \
  npm run test:integration --workspace @parking/api
```

## Ordem de implementacao

1. Inicializar o Next.js e a conexao com PostgreSQL.
2. Converter o DBML em schema do Drizzle e migrations.
3. Implementar login, sessao e autorizacao por papel.
4. Entregar setores antes das funcionalidades que dependem deles.
5. Entregar reserva e cancelamento com transacoes.
6. Desenvolver ranking, lista de espera e historico.
7. Integrar os fluxos e executar os criterios de aceite.

As operacoes que alteram disponibilidade devem bloquear o setor dentro de uma transacao. Isso evita que duas requisicoes consumam a mesma ultima vaga ou promovam duas placas para uma unica vaga liberada.

O shell administrativo e adaptado do projeto [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin), licenciado sob MIT. A adaptacao usa Next.js e mantem somente os elementos necessarios ao estacionamento.
