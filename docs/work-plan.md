# Plano de trabalho

## Objetivo

Entregar as cinco historias como um unico fluxo demonstravel e protegido por login: cadastrar um setor como administrador, reservar ou entrar na fila como motorista, cancelar, promover a primeira placa, consultar o ranking e abrir o historico permitido para cada papel.

## Regras compartilhadas

- Login usa e-mail normalizado e senha armazenada somente como hash seguro.
- `USER` acessa somente as proprias reservas, filas e historicos.
- `ADMIN` administra setores e acessa a visao completa e o ranking.
- O primeiro administrador e criado por seed com credenciais recebidas por variaveis de ambiente.
- A autorizacao e aplicada no servidor, nao apenas escondendo elementos da interface.
- Placas sao normalizadas antes da validacao e persistencia.
- Data prevista de chegada precisa estar no futuro.
- Alteracoes de cota, cancelamento e promocao acontecem em uma unica transacao.
- A transacao bloqueia o registro do setor antes de verificar ou alterar `available_spots`.
- O banco impede mais de uma reserva ativa para a mesma placa.
- Eventos de historico sao inseridos na mesma transacao da mudanca que representam.
- A fila usa `joined_at` e `id` para manter uma ordem deterministica.
- Respostas de erro usam um contrato comum para que a interface mostre mensagens consistentes.

## Divisao inicial para seis desenvolvedores

### Pessoa 1: fundacao e dados

- Inicializar Next.js, TypeScript e scripts do projeto.
- Configurar PostgreSQL, Drizzle e variaveis de ambiente.
- Implementar enums, tabelas, checks, chaves e indices de `docs/database.dbml`.
- Implementar login por e-mail e senha, sessao e autorizacao por papel.
- Criar seed do primeiro administrador sem gravar credenciais no repositorio.
- Criar seed pequeno de dados para demonstracao.
- Entregar helpers de transacao usados por reserva e fila.

Pronto quando migrations sobem em um banco vazio, o administrador consegue entrar, um usuario comum recebe acesso negado nas rotas administrativas e as restricoes rejeitam dados invalidos.

### Pessoa 2: ESTC-1, setores

- Criar validacao de nome, localizacao, capacidade e tarifa.
- Criar endpoint ou Server Action de cadastro.
- Criar consulta de listagem.
- Criar formulario e lista com atualizacao sem recarregar manualmente.
- Restringir o cadastro a administradores e permitir a visualizacao dos setores pelos dois papeis.
- Testar nome vazio, capacidade menor que 1 e tarifa negativa.

Pronto quando todos os criterios de ESTC-1 podem ser demonstrados pela interface.

### Pessoa 3: ESTC-2, reserva e cancelamento

- Criar reserva com bloqueio transacional do setor.
- Vincular a reserva ao usuario autenticado e filtrar consultas por esse usuario.
- Impedir placa vazia, chegada passada, setor lotado e placa com reserva ativa.
- Decrementar a cota na criacao de reserva ativa.
- Cancelar somente reservas ativas.
- Incrementar a cota quando nao houver promocao da fila.
- Registrar eventos de criacao e cancelamento.
- Impedir que um usuario consulte ou cancele a reserva de outro usuario.
- Testar duas tentativas concorrentes para a ultima vaga.

Pronto quando reserva, cancelamento, cota e mensagens atendem ESTC-2 sem corrida conhecida.

### Pessoa 4: ESTC-3, ranking

- Consultar setores pela quantidade de reservas que chegaram ao estado ativo.
- Ordenar por total decrescente e definir desempate deterministico por nome e id.
- Criar tela com total por setor.
- Restringir ranking a administradores.
- Criar estado vazio quando nenhuma reserva foi ativada.
- Testar ordenacao, desempate e estado vazio.

Pronto quando os tres criterios de ESTC-3 estao cobertos.

### Pessoa 5: ESTC-4, lista de espera

- Oferecer entrada na fila quando a cota estiver zerada.
- Impedir placa ativa e entrada duplicada no mesmo setor.
- Listar a fila em ordem deterministica.
- Permitir saida voluntaria.
- Restringir entrada, listagem e saida da fila ao usuario responsavel.
- Integrar cancelamento com promocao atomica da primeira entrada.
- Manter a cota zerada quando uma vaga liberada for atribuida a fila.
- Registrar entrada, saida e promocao no historico.
- Testar cancelamento concorrente e ordem FIFO.

Pronto quando todos os fluxos e estados vazios de ESTC-4 funcionam pela interface.

### Pessoa 6: ESTC-5, historico e integracao

- Criar consulta cronologica dos eventos de uma reserva.
- Mostrar data, hora e descricao de cada evento.
- Exibir o cancelamento que originou uma promocao.
- Criar a tela de historico e o estado de reserva recem-criada.
- Permitir ao usuario consultar apenas o proprio historico e ao administrador consultar todos.
- Mostrar o autor humano do evento quando existir.
- Revisar navegacao, mensagens e estados vazios das cinco historias.
- Preparar roteiro de demonstracao e conferir o README.

Pronto quando criacao, cancelamento, fila, saida e promocao aparecem corretamente em ESTC-5.

## Dependencias e paralelismo

1. A Pessoa 1 publica primeiro o schema, migrations e contratos de erro.
2. As Pessoas 2, 3 e 4 iniciam assim que os contratos basicos estiverem definidos.
3. A Pessoa 5 combina seu fluxo com o cancelamento da Pessoa 3 antes de considerar ESTC-4 concluida.
4. A Pessoa 6 pode construir a consulta cedo, mas depende dos produtores de eventos para validar o historico completo.
5. Cada pessoa abre uma branch por historia e integra alteracoes pequenas para reduzir conflitos.

## Contratos que devem ser combinados no inicio

- Formato da sessao e estrategia de autorizacao no servidor.
- Credenciais obrigatorias do administrador no seed e politica de senha.
- Formato de placa normalizada.
- Formato de erros da API.
- Nomes e estados dos enums.
- Fuso usado para entrada e exibicao de datas.
- Operacao transacional compartilhada entre cancelamento e promocao.

## Roteiro de demonstracao

1. Entrar como administrador e cadastrar dois setores, incluindo as validacoes de ESTC-1.
2. Entrar como motorista, preencher um setor, reservar sua ultima vaga e mostrar a nova cota.
3. Tentar reserva duplicada e reserva em setor lotado.
4. Colocar duas placas de usuarios distintos na fila e mostrar a ordem.
5. Cancelar a reserva ativa e mostrar a primeira placa promovida sem aumentar a cota.
6. Retirar voluntariamente a segunda placa da fila.
7. Comprovar que um motorista nao acessa os dados do outro nem o ranking.
8. Entrar como administrador e mostrar o ranking.
9. Abrir os historicos da reserva cancelada e da reserva promovida.

## Validacao final

- Executar testes focados de dominio e API por historia.
- Testar acesso anonimo, acesso de usuario e acesso de administrador nas rotas protegidas.
- Executar typecheck, lint e build.
- Subir o banco a partir de zero e aplicar todas as migrations.
- Executar o roteiro de demonstracao sem ajustar dados manualmente.
- Conferir cada criterio das cinco historias e registrar qualquer risco restante.
