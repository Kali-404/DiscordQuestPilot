# DiscordQuestPilot

Uma versão aprimorada do **DiscordQuestPilot**, com foco em estabilidade, controle de execução, tratamento de erros e encerramento seguro.

## Autor

**DiscordQuestPilot** foi criado por **Kali404**.

Se você redistribuir, modificar ou utilizar este projeto como base para outra versão, mantenha os créditos ao autor original.

> [!IMPORTANT]
> Este projeto não é afiliado, patrocinado ou endossado pela Discord Inc.
>
> O projeto utiliza funcionalidades internas do cliente Discord. Atualizações do Discord podem alterar essas funcionalidades e afetar sua compatibilidade.

---

## Sobre o projeto

O **DiscordQuestPilot** identifica Quests compatíveis disponíveis na conta e gerencia seu processamento.

### Tipos de Quest reconhecidos

* `WATCH_VIDEO`
* `WATCH_VIDEO_ON_MOBILE`
* `PLAY_ON_DESKTOP`
* `STREAM_ON_DESKTOP`
* `PLAY_ACTIVITY`

---

# Controles

Esta versão possui atalhos de teclado para controlar rapidamente a execução.

| Tecla | Ação                                           |
| ----- | ---------------------------------------------- |
| **P** | Para a execução e realiza o cleanup            |
| **S** | Reinicia o processamento e recarrega as Quests |

Os atalhos são ignorados enquanto o usuário estiver digitando em campos de texto do Discord.

Isso evita que escrever uma mensagem contendo as letras **P** ou **S** acione o script acidentalmente.

---

## Comandos pelo console

Os controles tradicionais também continuam disponíveis.

### Parar

```js
pararMissao()
```

### Reiniciar

```js
reiniciarMissao()
```

---

# Melhorias desta versão

## Proteção contra execução duplicada

O DiscordQuestPilot agora verifica se já existe uma instância inicializada.

Isso ajuda a evitar:

* listeners duplicados;
* múltiplos processamentos simultâneos;
* referências originais sobrescritas;
* problemas durante o cleanup;
* comportamento inconsistente após executar o script mais de uma vez.

---

## `pararMissao()` aprimorado

A função:

```js
pararMissao()
```

recebeu um processo de cleanup mais completo.

Ao parar, o script:

* interrompe a execução atual;
* invalida callbacks pertencentes à sessão anterior;
* remove listeners ativos;
* limpa estados temporários;
* restaura funções modificadas;
* limpa referências internas;
* impede que operações antigas continuem depois da parada.

Também é possível chamar `pararMissao()` novamente sem causar erro.

---

## Reinício com `reiniciarMissao()`

Foi adicionada a função:

```js
reiniciarMissao()
```

Ela também pode ser acionada pressionando:

```text
S
```

Ao reiniciar, o DiscordQuestPilot:

1. limpa estados anteriores;
2. recarrega a lista de Quests;
3. cria uma nova sessão;
4. verifica as Quests pendentes;
5. inicia novamente o processamento.

---

## Sistema de sessão

Cada execução recebe um identificador interno chamado `runId`.

Quando o script é parado, o identificador é alterado.

Com isso, callbacks pertencentes a uma execução anterior podem verificar se ainda pertencem à sessão atual antes de continuar.

Esse mecanismo melhora bastante o comportamento do script quando o usuário executa:

```text
P
```

e logo depois:

```text
S
```

---

## Atalhos protegidos durante digitação

Os atalhos não são executados quando o foco está em:

* `input`;
* `textarea`;
* elementos editáveis do Discord.

Isso evita paradas ou reinicializações acidentais durante conversas.

---

## Cleanup melhorado

O cleanup foi centralizado para restaurar o estado do cliente de maneira mais previsível.

O script tenta limpar individualmente cada estado temporário.

Caso uma etapa apresente erro, as outras ainda são executadas.

---

## Gerenciamento de listeners

Listeners registrados durante a execução são armazenados para permitir sua remoção posteriormente.

A referência é limpa mesmo se ocorrer algum erro durante a operação de unsubscribe.

---

## Melhor tratamento de erros

As operações assíncronas passam a verificar o estado da sessão antes de continuar.

Isso reduz situações em que uma execução antiga continua depois de:

* uma parada manual;
* uma reinicialização;
* um erro;
* uma nova sessão.

---

## Função auxiliar `sleep()`

Os delays foram centralizados através de:

```js
const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));
```

Isso reduz repetição e melhora a legibilidade.

---

## Validação das Quests

A validação foi reorganizada para verificar corretamente:

* existência da configuração;
* inscrição na Quest;
* estado de conclusão;
* data de expiração;
* configuração da tarefa;
* tipo de tarefa compatível.

Isso deixa o código mais tolerante a estruturas inesperadas.

---

# Interface no console

Ao iniciar, o script exibe:

```text
╔══════════════════════════════════════╗
       DiscordQuestPilot
       Criado por Kali404
╚══════════════════════════════════════╝

[P] Parar missão | [S] Reiniciar missão
```

---

# Compatibilidade

DiscordQuestPilot depende de funcionalidades internas relacionadas a:

* Quests;
* jogos em execução;
* streaming;
* canais;
* Flux Dispatcher;
* módulos webpack;
* API interna do cliente.

Essas funcionalidades não constituem uma API pública estável.

Atualizações do Discord podem modificar:

* nomes de módulos;
* propriedades internas;
* estruturas de objetos;
* eventos;
* endpoints;
* comportamento do cliente.

Quando isso acontecer, uma atualização do DiscordQuestPilot pode ser necessária.

---

# Changelog

## DiscordQuestPilot — versão aprimorada

### Adicionado

* identificação do criador **Kali404**;
* banner no console;
* atalho **P** para parar;
* atalho **S** para reiniciar;
* função `reiniciarMissao()`;
* proteção durante digitação;
* identificador de sessão `runId`;
* proteção contra execução duplicada;
* gerenciamento centralizado de estado;
* recarregamento das Quests durante reinício;
* verificações adicionais em operações assíncronas;
* função auxiliar `sleep()`.

### Melhorado

* `pararMissao()`;
* cleanup;
* gerenciamento de listeners;
* tratamento de erros;
* restauração de estado;
* gerenciamento de execução;
* reinicialização;
* validação de Quests;
* organização geral do código;
* mensagens exibidas no console.

### Corrigido

* possibilidade de callbacks antigos continuarem depois de um reinício;
* execução duplicada;
* listeners permanecendo ativos após interrupção;
* cleanup incompleto;
* continuação de determinadas operações depois da parada;
* comportamento inconsistente ao reiniciar rapidamente.

---

# Estrutura de controles

```text
DiscordQuestPilot
       │
       ├── P
       │    │
       │    └── pararMissao()
       │           │
       │           ├── interrompe execução
       │           ├── invalida sessão
       │           ├── remove listeners
       │           ├── limpa estado
       │           └── restaura funções
       │
       └── S
            │
            └── reiniciarMissao()
                    │
                    ├── limpa estado anterior
                    ├── recarrega Quests
                    ├── cria nova sessão
                    └── reinicia processamento
```

---

# Aviso

Use este projeto por sua própria conta e risco.

Você é responsável por verificar e respeitar as regras, termos e políticas aplicáveis ao Discord e ao sistema de Quests.

Discord é uma marca da Discord Inc.

Este projeto não possui qualquer vínculo oficial com a Discord Inc.

---

# Créditos

**Criador e mantenedor:** Kali404

**Projeto:** DiscordQuestPilot

Obrigado a todos que utilizam, testam, reportam problemas e contribuem para melhorar o projeto.

Se você criar uma versão modificada ou derivada do DiscordQuestPilot, mantenha os créditos ao criador original.
