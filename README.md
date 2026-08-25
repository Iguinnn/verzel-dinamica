# Verzel Dinamica: Estacionamento Rotativo

Aplicacao full stack para administrar setores, reservas, lista de espera e historico de um estacionamento rotativo.

## Escopo

O produto cobre cinco historias:

1. cadastro e listagem de setores;
2. reserva e cancelamento de vagas;
3. ranking de setores por quantidade de reservas;
4. lista de espera com promocao automatica;
5. historico completo das alteracoes de uma reserva.

Autenticacao e perfis de usuario nao fazem parte desta primeira versao.

## Stack acordada

- Next.js com App Router
- TypeScript
- PostgreSQL
- Drizzle ORM

## Documentacao

- [Modelo relacional em DBML](docs/database.dbml)
- [Plano de trabalho para seis desenvolvedores](docs/work-plan.md)

## Ordem de implementacao

1. Inicializar o Next.js e a conexao com PostgreSQL.
2. Converter o DBML em schema do Drizzle e migrations.
3. Entregar setores antes das funcionalidades que dependem deles.
4. Entregar reserva e cancelamento com transacoes.
5. Desenvolver ranking, lista de espera e historico.
6. Integrar os fluxos e executar os criterios de aceite.

As operacoes que alteram disponibilidade devem bloquear o setor dentro de uma transacao. Isso evita que duas requisicoes consumam a mesma ultima vaga ou promovam duas placas para uma unica vaga liberada.
