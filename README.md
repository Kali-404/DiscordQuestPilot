## Como utilizar

O **DiscordQuestPilot** foi desenvolvido para ser executado diretamente pelo console de desenvolvedor do cliente Discord.

> [!NOTE]
> O funcionamento depende de módulos internos do Discord. A interface e os nomes das opções do DevTools podem variar conforme a versão do cliente.

### 1. Abra o Discord

Inicie o cliente Discord normalmente e entre na conta que possui as Quests que você deseja acompanhar.

Antes de executar o script, verifique se a Quest desejada já está disponível/aceita na sua conta.

### 2. Abra as ferramentas de desenvolvedor

Abra o **DevTools** do cliente Discord e acesse a aba:

```text
Console
```

> [!WARNING]
> Nunca execute códigos de origem desconhecida no console. Revise o conteúdo do script antes de executá-lo e utilize somente uma cópia obtida de uma fonte em que você confia.

### 3. Copie o script

Abra o arquivo:

```text
DiscordQuestPilot_Final.js
```

Selecione todo o conteúdo e copie.

### 4. Execute no console

Cole o conteúdo no console do Discord e pressione:

```text
Enter
```

Quando a inicialização ocorrer corretamente, será exibido algo semelhante a:

```text
╔══════════════════════════════════════╗
       DiscordQuestPilot
       Criado por Kali404
╚══════════════════════════════════════╝

[P] Parar missão | [S] Reiniciar missão
```

O script verificará as Quests compatíveis e pendentes disponíveis.

---

## Controles

Depois de iniciado, o DiscordQuestPilot possui dois atalhos principais:

| Tecla | Função                                                     |
| ----- | ---------------------------------------------------------- |
| **P** | Para a execução atual e realiza o cleanup                  |
| **S** | Reinicia o script e verifica novamente as Quests pendentes |

### Parar a execução

Pressione:

```text
P
```

O DiscordQuestPilot interromperá a execução atual e realizará o processo de cleanup.

Também é possível executar manualmente pelo console:

```js
pararMissao()
```

### Reiniciar

Depois de parar, pressione:

```text
S
```

O script verificará novamente as Quests disponíveis e iniciará uma nova sessão de processamento.

O mesmo pode ser feito pelo console:

```js
reiniciarMissao()
```

> [!TIP]
> Os atalhos **P** e **S** são ignorados enquanto você estiver digitando em campos de mensagem ou outros elementos editáveis do Discord. Portanto, digitar normalmente no chat não deverá acionar os comandos.

---

## Executando novamente

Não é necessário colar novamente o script apenas para reiniciar uma execução que foi parada com **P**.

Use:

```text
S
```

ou:

```js
reiniciarMissao()
```

Se você recarregar ou fechar completamente o Discord, o código executado pelo console deixa de existir naquela sessão. Nesse caso, será necessário executar o `DiscordQuestPilot_Final.js` novamente.

---

## Se nenhuma Quest for encontrada

Caso apareça:

```text
Nenhuma Quest compatível e pendente.
```

verifique se:

* existe uma Quest disponível na sua conta;
* a Quest já foi aceita/inscrita;
* a Quest ainda não foi concluída;
* a Quest ainda não expirou;
* o tipo da Quest é reconhecido pela versão atual do DiscordQuestPilot.

Os tipos atualmente reconhecidos são:

```text
WATCH_VIDEO
WATCH_VIDEO_ON_MOBILE
PLAY_ON_DESKTOP
STREAM_ON_DESKTOP
PLAY_ACTIVITY
```

---

## Se o script apresentar erro

Como o DiscordQuestPilot depende de componentes internos do cliente Discord, uma atualização do Discord pode alterar módulos utilizados pelo projeto.

Se aparecer uma mensagem como:

```text
Não foi possível localizar todos os módulos necessários.
```

a versão atual do Discord pode não ser compatível com aquela versão do script.

Antes de tentar executar novamente:

1. pare qualquer execução anterior;
2. recarregue o Discord;
3. verifique se existe uma versão mais recente do DiscordQuestPilot;
4. consulte a página de **Issues** do repositório para verificar se o problema já foi reportado.

Ao abrir uma nova Issue, inclua a mensagem de erro exibida no console, mas remova tokens, IDs privados ou qualquer outra informação pessoal antes de publicar.

---

## Resumo rápido

```text
1. Abra o Discord
        ↓
2. Abra DevTools → Console
        ↓
3. Copie DiscordQuestPilot_Final.js
        ↓
4. Cole no Console
        ↓
5. Pressione Enter
        ↓
6. DiscordQuestPilot inicia

P → Parar
S → Reiniciar
```

### Importante

Executar scripts no console do Discord envolve código de terceiros e funcionalidades internas do cliente. Leia o código antes de utilizá-lo e esteja ciente de que modificações ou automações podem estar sujeitas aos termos e políticas do Discord.

**Criador:** Kali404
**Projeto:** DiscordQuestPilot
