/*
 * ============================================================
 * DiscordQuestPilot
 * ============================================================
 *
 * Criador: Kali404
 * Projeto: DiscordQuestPilot
 *
 * Script desenvolvido e mantido por Kali404.
 *
 * Este projeto não é afiliado, patrocinado ou endossado
 * pela Discord Inc.
 *
 * O Discord pode alterar suas funções internas a qualquer
 * momento, o que pode afetar a compatibilidade deste script.
 *
 * ============================================================
 */

(() => {
    "use strict";

    const PREFIX = "[DiscordQuestPilot]";

    // ============================================================
    // PROTEÇÃO CONTRA EXECUÇÃO DUPLICADA
    // ============================================================

    if (window.DiscordQuestPilot?.inicializado) {
        console.warn(
            `${PREFIX} O script já foi inicializado.`
        );

        return;
    }

    // ============================================================
    // ESTADO GLOBAL
    // ============================================================

    window.DiscordQuestPilot = {
        inicializado: true,
        executando: false,
        runId: 0,
        unsubscribeFn: null,
        fakeGameAtual: null,

        originals: {
            getRunningGames: null,
            getGameForPID: null,
            getStreamerActiveStreamMetadata: null
        },

        keyHandler: null
    };

    const state = window.DiscordQuestPilot;

    // Compatibilidade com versões anteriores.
    Object.defineProperty(window, "scriptExecutando", {
        configurable: true,

        get() {
            return state.executando;
        },

        set(value) {
            state.executando = Boolean(value);
        }
    });

    // ============================================================
    // LOG
    // ============================================================

    const log = {
        info(...args) {
            console.log(
                `%c${PREFIX}`,
                "color:#58F0F7;font-weight:bold;",
                ...args
            );
        },

        success(...args) {
            console.log(
                `%c${PREFIX}`,
                "color:#57F287;font-weight:bold;",
                ...args
            );
        },

        warn(...args) {
            console.warn(PREFIX, ...args);
        },

        error(...args) {
            console.error(PREFIX, ...args);
        }
    };

    // ============================================================
    // UTILITÁRIOS
    // ============================================================

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    function criarNovaExecucao() {
        state.runId++;

        const id = state.runId;

        return {
            id,

            ativa() {
                return (
                    state.executando &&
                    state.runId === id
                );
            }
        };
    }

    // ============================================================
    // WEBPACK
    // ============================================================

    let wpRequire;

    try {
        wpRequire =
            window.webpackChunkdiscord_app.push([
                [Symbol("DiscordQuestPilot")],
                {},
                r => r
            ]);

        window.webpackChunkdiscord_app.pop();

    } catch (error) {
        log.error(
            "Não foi possível acessar o webpack do Discord.",
            error
        );

        delete window.DiscordQuestPilot;

        return;
    }

    // ============================================================
    // DESCOBERTA DOS MÓDULOS
    // ============================================================

    const modules =
        Object.values(wpRequire.c);

    const ApplicationStreamingStore =
        modules.find(
            x =>
                x?.exports?.A?.__proto__
                    ?.getStreamerActiveStreamMetadata
        )?.exports?.A;

    const RunningGameStore =
        modules.find(
            x =>
                x?.exports?.Ay
                    ?.getRunningGames
        )?.exports?.Ay;

    const QuestsStore =
        modules.find(
            x =>
                x?.exports?.A?.__proto__
                    ?.getQuest
        )?.exports?.A;

    const ChannelStore =
        modules.find(
            x =>
                x?.exports?.A?.__proto__
                    ?.getAllThreadsForParent
        )?.exports?.A;

    const GuildChannelStore =
        modules.find(
            x =>
                x?.exports?.Ay
                    ?.getSFWDefaultChannel
        )?.exports?.Ay;

    const FluxDispatcher =
        modules.find(
            x =>
                x?.exports?.h?.__proto__
                    ?.flushWaitQueue
        )?.exports?.h;

    const api =
        modules.find(
            x =>
                x?.exports?.Bo?.get
        )?.exports?.Bo;

    // ============================================================
    // VALIDAÇÃO
    // ============================================================

    if (
        !ApplicationStreamingStore ||
        !RunningGameStore ||
        !QuestsStore ||
        !ChannelStore ||
        !GuildChannelStore ||
        !FluxDispatcher ||
        !api
    ) {
        log.error(
            "Não foi possível localizar todos os módulos necessários."
        );

        log.error(
            "O cliente Discord pode ter mudado internamente."
        );

        delete window.DiscordQuestPilot;

        return;
    }

    // ============================================================
    // TIPOS DE QUEST
    // ============================================================

    const supportedTasks = [
        "WATCH_VIDEO",
        "PLAY_ON_DESKTOP",
        "STREAM_ON_DESKTOP",
        "PLAY_ACTIVITY",
        "WATCH_VIDEO_ON_MOBILE"
    ];

    // ============================================================
    // CARREGAR QUESTS
    // ============================================================

    function carregarQuests() {
        return [
            ...QuestsStore.quests.values()
        ].filter(quest => {

            const config =
                quest?.config;

            const status =
                quest?.userStatus;

            if (!config) {
                return false;
            }

            if (!status?.enrolledAt) {
                return false;
            }

            if (status?.completedAt) {
                return false;
            }

            const expiresAt =
                new Date(
                    config.expiresAt
                ).getTime();

            if (
                !Number.isFinite(expiresAt) ||
                expiresAt <= Date.now()
            ) {
                return false;
            }

            const taskConfig =
                config.taskConfig ??
                config.taskConfigV2;

            if (!taskConfig?.tasks) {
                return false;
            }

            return supportedTasks.some(
                type =>
                    taskConfig.tasks[type] != null
            );
        });
    }

    let quests = [];

    // ============================================================
    // LISTENER
    // ============================================================

    function removerListener() {
        if (!state.unsubscribeFn) {
            return;
        }

        try {
            FluxDispatcher.unsubscribe(
                "QUESTS_SEND_HEARTBEAT_SUCCESS",
                state.unsubscribeFn
            );

        } catch (error) {
            log.warn(
                "Falha ao remover listener:",
                error
            );

        } finally {
            state.unsubscribeFn = null;
        }
    }

    // ============================================================
    // ESTADO TEMPORÁRIO
    // ============================================================

    function removerJogoTemporario() {
        if (!state.fakeGameAtual) {
            return;
        }

        try {
            FluxDispatcher.dispatch({
                type: "RUNNING_GAMES_CHANGE",
                removed: [
                    state.fakeGameAtual
                ],
                added: [],
                games: []
            });

        } catch (error) {
            log.warn(
                "Falha ao remover estado temporário:",
                error
            );

        } finally {
            state.fakeGameAtual = null;
        }
    }

    // ============================================================
    // RESTAURAR FUNÇÕES
    // ============================================================

    function restaurarFuncoes() {
        if (
            typeof state.originals
                .getRunningGames ===
            "function"
        ) {
            try {
                RunningGameStore
                    .getRunningGames =
                    state.originals
                        .getRunningGames;

            } catch (error) {
                log.warn(
                    "Falha ao restaurar getRunningGames:",
                    error
                );
            }
        }

        if (
            typeof state.originals
                .getGameForPID ===
            "function"
        ) {
            try {
                RunningGameStore
                    .getGameForPID =
                    state.originals
                        .getGameForPID;

            } catch (error) {
                log.warn(
                    "Falha ao restaurar getGameForPID:",
                    error
                );
            }
        }

        if (
            typeof state.originals
                .getStreamerActiveStreamMetadata ===
            "function"
        ) {
            try {
                ApplicationStreamingStore
                    .getStreamerActiveStreamMetadata =
                    state.originals
                        .getStreamerActiveStreamMetadata;

            } catch (error) {
                log.warn(
                    "Falha ao restaurar streaming:",
                    error
                );
            }
        }

        state.originals.getRunningGames =
            null;

        state.originals.getGameForPID =
            null;

        state.originals
            .getStreamerActiveStreamMetadata =
            null;
    }

    // ============================================================
    // PARAR MISSÃO
    // ============================================================

    window.pararMissao = function () {
        if (!state.executando) {
            log.info(
                "O script já está parado."
            );

            return;
        }

        log.info(
            "Encerrando execução..."
        );

        state.executando = false;

        // Invalida qualquer callback pertencente
        // à sessão anterior.
        state.runId++;

        removerListener();
        removerJogoTemporario();
        restaurarFuncoes();

        log.success(
            "Script parado e cleanup concluído."
        );

        log.info(
            "Pressione S para reiniciar."
        );
    };

    // ============================================================
    // PROCESSAR QUESTS
    // ============================================================

    async function processarQuests() {
        const execution =
            criarNovaExecucao();

        while (
            execution.ativa() &&
            quests.length > 0
        ) {
            const quest =
                quests.pop();

            if (!quest) {
                break;
            }

            const questName =
                quest.config
                    ?.messages
                    ?.questName ??
                quest.id;

            const taskConfig =
                quest.config.taskConfig ??
                quest.config.taskConfigV2;

            const taskName =
                supportedTasks.find(
                    type =>
                        taskConfig
                            ?.tasks
                            ?.[type] != null
                );

            if (!taskName) {
                log.warn(
                    `Quest não suportada: ${questName}`
                );

                continue;
            }

            const taskData =
                taskConfig.tasks[
                    taskName
                ];

            const target =
                Number(
                    taskData?.target ?? 0
                );

            log.info(
                `Quest: ${questName}`
            );

            log.info(
                `Tipo: ${taskName}`
            );

            log.info(
                `Meta: ${target} segundos`
            );

            /*
             * =====================================================
             * ROTINAS DE PROCESSAMENTO
             * =====================================================
             *
             * Mantenha aqui as rotinas que você já possui no seu
             * arquivo local.
             *
             * Os tipos reconhecidos são:
             *
             * WATCH_VIDEO
             * WATCH_VIDEO_ON_MOBILE
             * PLAY_ON_DESKTOP
             * STREAM_ON_DESKTOP
             * PLAY_ACTIVITY
             *
             * Para verificar se a execução atual continua válida:
             *
             * execution.ativa()
             *
             * Listener atual:
             *
             * state.unsubscribeFn
             *
             * Estado temporário atual:
             *
             * state.fakeGameAtual
             *
             * Funções originais:
             *
             * state.originals
             *
             * =====================================================
             */

            if (!execution.ativa()) {
                return;
            }

            // Evita loop agressivo caso nenhuma
            // rotina esteja conectada.
            await sleep(50);
        }

        if (
            execution.ativa() &&
            quests.length === 0
        ) {
            log.success(
                "Todas as Quests compatíveis foram processadas."
            );
        }
    }

    // ============================================================
    // REINICIAR MISSÃO
    // ============================================================

    window.reiniciarMissao =
        function () {

            if (state.executando) {
                log.info(
                    "O script já está executando."
                );

                return;
            }

            removerListener();
            removerJogoTemporario();
            restaurarFuncoes();

            quests =
                carregarQuests();

            if (
                quests.length === 0
            ) {
                log.info(
                    "Nenhuma Quest compatível e pendente."
                );

                return;
            }

            state.executando =
                true;

            log.success(
                "Execução reiniciada."
            );

            log.info(
                `${quests.length} Quest(s) encontrada(s).`
            );

            processarQuests()
                .catch(error => {

                    log.error(
                        "Erro durante processamento:",
                        error
                    );

                    if (state.executando) {
                        window.pararMissao();
                    }
                });
        };

    // ============================================================
    // ATALHOS
    // ============================================================

    if (
        window
            .discordQuestPilotKeyHandler
    ) {
        window.removeEventListener(
            "keydown",
            window
                .discordQuestPilotKeyHandler
        );
    }

    window
        .discordQuestPilotKeyHandler =
        function (event) {

            if (
                event.repeat ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            ) {
                return;
            }

            const target =
                event.target;

            const tagName =
                target
                    ?.tagName
                    ?.toLowerCase();

            // Ignora teclas enquanto o usuário
            // estiver digitando.
            if (
                tagName === "input" ||
                tagName === "textarea" ||
                target?.isContentEditable
            ) {
                return;
            }

            const key =
                event.key
                    ?.toLowerCase();

            // P = PARAR
            if (key === "p") {
                window.pararMissao();
                return;
            }

            // S = REINICIAR
            if (key === "s") {
                window.reiniciarMissao();
            }
        };

    window.addEventListener(
        "keydown",
        window
            .discordQuestPilotKeyHandler
    );

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================

    console.log(
        "%c╔══════════════════════════════════════╗",
        "color:#58F0F7;font-size:16px;font-weight:bold;"
    );

    console.log(
        "%c       DiscordQuestPilot",
        "color:#58F0F7;font-size:22px;font-weight:bold;"
    );

    console.log(
        "%c       Criado por Kali404",
        "color:#57F287;font-size:17px;font-weight:bold;"
    );

    console.log(
        "%c╚══════════════════════════════════════╝",
        "color:#58F0F7;font-size:16px;font-weight:bold;"
    );

    console.log(
        "%c[P] Parar missão  %c|  %c[S] Reiniciar missão",
        "color:#ED4245;font-size:16px;font-weight:bold;",
        "color:#B5BAC1;font-size:16px;font-weight:bold;",
        "color:#57F287;font-size:16px;font-weight:bold;"
    );

    quests =
        carregarQuests();

    if (
        quests.length === 0
    ) {
        log.info(
            "Nenhuma Quest compatível e pendente."
        );

        return;
    }

    state.executando =
        true;

    log.info(
        `${quests.length} Quest(s) encontrada(s).`
    );

    processarQuests()
        .catch(error => {

            log.error(
                "Erro inesperado:",
                error
            );

            if (state.executando) {
                window.pararMissao();
            }
        });
})();
