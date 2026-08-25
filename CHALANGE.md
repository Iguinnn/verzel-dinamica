# CONTEXTO
O minimundo
O estacionamento rotativo da praça central sempre funcionou com um caderno na guarita. Quando alguém liga pedindo para guardar uma vaga, o operador anota a placa numa folha solta e torce para lembrar na hora. Com o movimento crescendo, começou a dar problema: setor que já prometeu mais vagas do que tem, motorista que reservou duas vezes no mesmo dia, e no fim do mês ninguém sabe dizer qual setor tem mais procura. O administrador pediu ajuda para informatizar esse controle.
Vocês foram convidados para construir a primeira versão dessa aplicação. O sistema precisa dar conta do dia a dia do estacionamento: manter a configuração dos setores, controlar reservas e cancelamentos, e oferecer algumas visões que ajudem o administrador a entender a procura pelo pátio.
REGRAS DE FUNCIONAMENTO DO ESTACIONAMENTO
O pátio é dividido em setores. Cada setor tem um nome, uma localização, uma cota de vagas reserváveis e uma tarifa por hora.
Uma vaga só pode ser reservada se houver cota disponível no setor; ao reservar, uma vaga sai da cota, e ao cancelar, ela retorna.
Uma mesma placa pode ter no máximo uma reserva ativa ao mesmo tempo.
Quando o setor está sem cota, o motorista pode entrar em uma lista de espera e ser contemplado se alguém cancelar.
O administrador quer acompanhar tanto o histórico de cada reserva quanto os setores mais procurados.
O trabalho será entregue em partes. Cada parte representa uma necessidade do estacionamento e será liberada conforme vocês avançam. Não se espera que concluam tudo — o que importa é como o grupo constrói, decide e resolve os problemas ao longo do caminho.
BACKLOG DO DESAFIO
As histórias abaixo são liberadas em sequência. Cada uma só é entregue quando a anterior estiver funcionando.
HISTÓRIA ESTC-1
Cadastro e listagem de setores
Como administrador, quero cadastrar os setores do estacionamento e visualizá-los, para manter a estrutura do pátio configurada e acessível. Um setor possui: nome, localização, cota de vagas reserváveis e tarifa por hora. A aplicação deve expor uma API para essas operações e uma tela que a consuma.
CRITÉRIOS DE ACEITE
[ ] É possível cadastrar um setor com nome, localização, cota de vagas e tarifa por hora.
[ ] Após o cadastro, o setor aparece na listagem sem recarregar a página manualmente.
[ ] A tela principal exibe a lista de setores com seus dados.
[ ] Cadastro com nome vazio é recusado e a mensagem de erro é exibida na tela.
[ ] Cadastro com cota de vagas menor que 1 é recusado e a mensagem de erro é exibida na tela.
[ ] Cadastro com tarifa negativa é recusado e a mensagem de erro é exibida na tela.
HISTÓRIA ESTC-2
Reserva e cancelamento de vagas
Como motorista, quero reservar antecipadamente uma vaga em um setor e poder cancelar, para garantir lugar no pátio sem depender da disponibilidade no momento da chegada. Ao reservar, a cota disponível do setor diminui em 1; ao cancelar, aumenta em 1. Uma mesma placa não pode ter mais de uma reserva ativa ao mesmo tempo.
CRITÉRIOS DE ACEITE
[ ] Reservar uma vaga em um setor com cota disponível registra a placa, o setor e a data/hora prevista de chegada, e diminui a cota disponível em 1.
[ ] A tela reflete a nova cota disponível do setor após a reserva.
[ ] Reserva com placa vazia é recusada e a mensagem de erro é exibida na tela.
[ ] Reserva com data/hora prevista no passado é recusada e a mensagem de erro é exibida na tela.
[ ] Reservar em um setor sem cota disponível é recusado e o motorista é avisado na tela.
[ ] Reservar com uma placa que já tem reserva ativa é recusado e o motorista é avisado do limite na tela.
[ ] Cancelar uma reserva ativa a encerra e aumenta a cota disponível do setor em 1.
[ ] Uma reserva já cancelada não pode ser cancelada novamente.
HISTÓRIA ESTC-3
Ranking de setores mais reservados
Como administrador, quero ver quais setores são mais reservados, para entender a procura por cada área do pátio.
CRITÉRIOS DE ACEITE
[ ] A visão de ranking exibe os setores ordenados pela quantidade de reservas registradas.
[ ] Cada item mostra o total de vezes que o setor foi reservado.
[ ] Quando nenhuma reserva foi registrada ainda, a tela exibe um estado vazio tratado, sem erro.
HISTÓRIA ESTC-4
Lista de espera por setor
Como motorista, quero entrar em uma lista de espera quando o setor estiver sem cota disponível, para ser contemplado automaticamente se alguém cancelar. Quando uma reserva ativa é cancelada, a primeira placa da lista de espera daquele setor passa a ter uma reserva ativa no lugar dela.
CRITÉRIOS DE ACEITE
[ ] Ao tentar reservar em um setor sem cota disponível, é oferecida a entrada na lista de espera daquele setor.
[ ] Entrar na lista de espera registra a placa, o setor e a data/hora prevista de chegada, e não altera a cota disponível do setor.
[ ] A tela exibe a lista de espera de cada setor na ordem de entrada.
[ ] Uma placa que já tem reserva ativa não pode entrar na lista de espera e é avisada na tela.
[ ] Uma placa que já está na lista de espera de um setor não pode entrar novamente na mesma lista e é avisada na tela.
[ ] Ao cancelar uma reserva ativa de um setor com lista de espera, a primeira placa da lista passa a ter uma reserva ativa e sai da lista.
[ ] Quando a lista de espera é acionada por um cancelamento, a cota disponível do setor permanece a mesma.
[ ] Ao cancelar uma reserva ativa de um setor sem lista de espera, a cota disponível aumenta em 1.
[ ] É possível sair da lista de espera por vontade própria, e as placas seguintes avançam mantendo a ordem.
[ ] Quando um setor não tem ninguém na lista de espera, a tela exibe um estado vazio tratado, sem erro.
HISTÓRIA ESTC-5
Histórico de alterações da reserva
Como administrador, quero ver tudo o que aconteceu com uma reserva desde a sua criação, para entender como ela chegou à situação atual e resolver contestações de motoristas.
CRITÉRIOS DE ACEITE
[ ] Cada reserva possui uma visão de histórico com os eventos ocorridos, do mais antigo para o mais recente.
[ ] Cada evento exibe a data/hora em que ocorreu e o que aconteceu.
[ ] A criação da reserva aparece no histórico.
[ ] O cancelamento da reserva aparece no histórico.
[ ] A entrada na lista de espera aparece no histórico.
[ ] A saída voluntária da lista de espera aparece no histórico.
[ ] A promoção da lista de espera para reserva ativa aparece no histórico e indica qual cancelamento a originou.
[ ] O histórico de uma reserva recém-criada exibe apenas o evento de criação, sem erro.