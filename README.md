# Estacionamento Rotativo

Aplicacao full stack para administrar usuarios, setores, reservas, lista de espera e historico de um estacionamento rotativo.

## Escopo

O produto cobre cinco historias:

1. cadastro e listagem de setores;
2. reserva e cancelamento de vagas;
3. ranking de setores por quantidade de reservas;
4. lista de espera com promocao automatica;
5. historico completo das alteracoes de uma reserva.

O sistema possui login por e-mail e senha. Motoristas acessam somente as proprias reservas, filas e historicos. Administradores gerenciam setores e acessam a visao operacional completa e o ranking.

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
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

O frontend fica em `http://localhost:3000` e a API em `http://localhost:3333`.

O BFF usa `BACKEND_MODE=mock` para devolver fixtures locais ou `BACKEND_MODE=live` para consultar o Express. Os dois modos validam a resposta com o mesmo contrato compartilhado.

## Documentacao

- [Modelo relacional em DBML](docs/database.dbml)
- [Plano de trabalho para seis desenvolvedores](docs/work-plan.md)
- [Atribuicoes de terceiros](THIRD_PARTY_NOTICES.md)

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run dev:web` e `npm run dev:api` para iniciar os servicos separadamente.

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
