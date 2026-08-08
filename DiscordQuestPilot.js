/*
 * DiscordQuestPilot
 * Discord Quest automation script
 *
 * This project is not affiliated with, endorsed by, or sponsored by Discord Inc.
 *
 * IMPORTANT:
 * This script interacts with internal Discord client functionality.
 * Discord client updates may break compatibility.
 *
 * Use this software at your own risk and comply with applicable Discord rules.
 */

let wpRequire = window.webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
window.webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.A;
let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames)?.exports?.Ay;
let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports?.h;
let api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get)?.exports?.Bo;

if (!ApplicationStreamingStore || !RunningGameStore || !QuestsStore || !ChannelStore || !GuildChannelStore || !FluxDispatcher || !api) {
    console.error("[DiscordQuestPilot] Não foi possível localizar todos os módulos necessários do Discord.");
    console.error("[DiscordQuestPilot] O cliente do Discord pode ter mudado ou esta versão pode não ser compatível.");
    throw new Error("DiscordQuestPilot: módulos internos necessários não encontrados.");
}

window.scriptExecutando = true;
window.unsubscribeFn = null;

window.pararMissao = function () {
    window.scriptExecutando = false;

    console.log(
        "%cDiscordQuestPilot parado pelo usuário.",
        "color: #58F0F7; font-size: 18px; font-weight: bold; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;",
    );

    if (typeof window.realGetRunningGames !== "undefined") {
        RunningGameStore.getRunningGames = window.realGetRunningGames;
        delete window.realGetRunningGames;
    }

    if (typeof window.realGetGameForPID !== "undefined") {
        RunningGameStore.getGameForPID = window.realGetGameForPID;
        delete window.realGetGameForPID;
    }

    if (typeof window.realFunc !== "undefined") {
        ApplicationStreamingStore.getStreamerActiveStreamMetadata = window.realFunc;
        delete window.realFunc;
    }

    if (window.unsubscribeFn) {
        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", window.unsubscribeFn);
        window.unsubscribeFn = null;
    }

    console.log(
        "%cAs alterações temporárias do script foram restauradas.",
        "color: #58F0F7; font-size: 16px; font-weight: bold;",
    );
};

console.log(
    "%cDiscordQuestPilot iniciado.",
    "color: #58F0F7; font-size: 18px; font-weight: bold; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 1px 0 black, 0 -1px black;",
);
console.log(
    "%cDigite 'pararMissao()' no console para parar o script.",
    "color: #58F0F7; font-size: 16px; font-weight: bold;",
);

const supportedTasks = [
    "WATCH_VIDEO",
    "PLAY_ON_DESKTOP",
    "STREAM_ON_DESKTOP",
    "PLAY_ACTIVITY",
    "WATCH_VIDEO_ON_MOBILE",
];

let quests = [...QuestsStore.quests.values()].filter(x =>
    x.userStatus?.enrolledAt &&
    !x.userStatus?.completedAt &&
    new Date(x.config?.expiresAt).getTime() > Date.now() &&
    x.config &&
    (x.config.taskConfig ?? x.config.taskConfigV2)?.tasks &&
    supportedTasks.some(y =>
        Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)
    )
);

let isApp = typeof DiscordNative !== "undefined";

if (quests.length === 0) {
    console.log(
        "%cVocê não tem nenhuma Quest não concluída e compatível pendente.",
        "color: #58F0F7; font-size: 18px; font-weight: bold; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;",
    );
} else {
    let doJob = function () {
        if (!window.scriptExecutando) return;

        const quest = quests.pop();

        if (!quest) {
            console.log(
                "%cTodas as Quests compatíveis foram processadas.",
                "color: #58F0F7; font-size: 18px; font-weight: bold; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;",
            );
            return;
        }

        try {
            const pid = Math.floor(Math.random() * 30000) + 1000;

            const questName = quest.config.messages?.questName ?? quest.id;
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = supportedTasks.find(x => taskConfig?.tasks?.[x] != null);

            if (!taskName) {
                console.warn(`[DiscordQuestPilot] Tipo de Quest não suportado: ${quest.id}`);
                doJob();
                return;
            }

            const taskData = taskConfig.tasks[taskName];
            const applicationId = quest.config.application?.id ?? taskData?.applications?.[0]?.id ?? null;
            const secondsNeeded = Number(taskData?.target ?? 0);

            if (!secondsNeeded) {
                console.warn(`[DiscordQuestPilot] Alvo de progresso inválido para: ${questName}`);
                doJob();
                return;
            }

            let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

            if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                const speed = 7;
                let completed = false;

                let fn = async () => {
                    try {
                        while (window.scriptExecutando) {
                            const remaining = Math.min(speed, secondsNeeded - secondsDone);

                            if (remaining <= 0) break;

                            await new Promise(resolve => setTimeout(resolve, remaining * 1000));

                            const timestamp = secondsDone + speed;

                            const res = await api.post({
                                url: `/quests/${quest.id}/video-progress`,
                                body: {
                                    timestamp: Math.min(secondsNeeded, timestamp + Math.random()),
                                },
                            });

                            completed = res.body?.completed_at != null;
                            secondsDone = Math.min(secondsNeeded, timestamp);

                            if (timestamp >= secondsNeeded || !window.scriptExecutando) break;
                        }

                        if (!completed && window.scriptExecutando) {
                            await api.post({
                                url: `/quests/${quest.id}/video-progress`,
                                body: { timestamp: secondsNeeded },
                            });
                        }

                        if (window.scriptExecutando) {
                            console.log(
                                "%cQuest de vídeo concluída!",
                                "color: #58F0F7; font-size: 18px; font-weight: bold; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;",
                            );
                            doJob();
                        }
                    } catch (error) {
                        console.error("[DiscordQuestPilot] Erro na Quest de vídeo:", error);
                        doJob();
                    }
                };

                fn();

                console.log(
                    `%cProcessando vídeo: ${questName}`,
                    "color: #58F0F7; font-size: 18px; font-weight: bold; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;",
                );

            } else if (taskName === "PLAY_ON_DESKTOP") {
                if (!isApp) {
                    console.log(
                        `%cUse o aplicativo desktop do Discord para a Quest: ${questName}.`,
                        "color: #58F0F7; font-size: 18px; font-weight: bold;",
                    );
                    doJob();
                } else if (!applicationId) {
                    console.warn(`[DiscordQuestPilot] Aplicativo alvo não encontrado para: ${questName}`);
                    doJob();
                } else {
                    api.get({ url: `/applications/public?application_ids=${applicationId}` })
                        .then(res => {
                            const appData = res.body?.[0];

                            if (!appData) {
                                throw new Error("Dados do aplicativo alvo não encontrados.");
                            }

                            const exeName =
                                appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ??
                                appData.name?.replace(/[\/\\:*?"<>|]/g, "");

                            if (!exeName) {
                                throw new Error("Executável alvo não encontrado.");
                            }

                            const fakeGame = {
                                cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                                exeName,
                                exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                                hidden: false,
                                isLauncher: false,
                                id: applicationId,
                                name: appData.name,
                                pid,
                                pidPath: [pid],
                                processName: appData.name,
                                start: Date.now(),
                            };

                            const realGames = RunningGameStore.getRunningGames();

                            window.realGetRunningGames = RunningGameStore.getRunningGames;
                            window.realGetGameForPID = RunningGameStore.getGameForPID;

                            RunningGameStore.getRunningGames = () => [fakeGame];
                            RunningGameStore.getGameForPID = pidParam =>
                                [fakeGame].find(x => x.pid === pidParam);

                            FluxDispatcher.dispatch({
                                type: "RUNNING_GAMES_CHANGE",
                                removed: realGames,
                                added: [fakeGame],
                                games: [fakeGame],
                            });

                            let fn = data => {
                                if (!window.scriptExecutando) return;

                                const progress = quest.config.configVersion === 1
                                    ? data?.userStatus?.streamProgressSeconds ?? 0
                                    : Math.floor(data?.userStatus?.progress?.PLAY_ON_DESKTOP?.value ?? 0);

                                console.log(
                                    `%cProgresso (${appData.name}): ${progress}/${secondsNeeded} segundos`,
                                    "color: #58F0F7; font-size: 18px; font-weight: bold;",
                                );

                                if (progress >= secondsNeeded) {
                                    console.log(
                                        "%cQuest concluída!",
                                        "color: #58F0F7; font-size: 18px; font-weight: bold;",
                                    );

                                    RunningGameStore.getRunningGames = window.realGetRunningGames;
                                    RunningGameStore.getGameForPID = window.realGetGameForPID;

                                    delete window.realGetRunningGames;
                                    delete window.realGetGameForPID;

                                    FluxDispatcher.dispatch({
                                        type: "RUNNING_GAMES_CHANGE",
                                        removed: [fakeGame],
                                        added: [],
                                        games: [],
                                    });

                                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                    window.unsubscribeFn = null;

                                    doJob();
                                }
                            };

                            window.unsubscribeFn = fn;
                            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                            console.log(
                                `%cJogo simulado: ${appData.name}. Aguarde ~${Math.ceil((secondsNeeded - secondsDone) / 60)} min.`,
                                "color: #58F0F7; font-size: 18px; font-weight: bold;",
                            );
                        })
                        .catch(error => {
                            console.error("[DiscordQuestPilot] Erro ao processar Quest de desktop:", error);
                            doJob();
                        });
                }

            } else if (taskName === "STREAM_ON_DESKTOP") {
                if (!isApp) {
                    console.log(
                        `%cUse o aplicativo desktop do Discord para a Quest: ${questName}.`,
                        "color: #58F0F7; font-size: 18px; font-weight: bold;",
                    );
                    doJob();
                } else if (!applicationId) {
                    console.warn(`[DiscordQuestPilot] Aplicativo alvo não encontrado para: ${questName}`);
                    doJob();
                } else {
                    window.realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                        id: applicationId,
                        pid,
                        sourceName: null,
                    });

                    let fn = data => {
                        if (!window.scriptExecutando) return;

                        const progress = quest.config.configVersion === 1
                            ? data?.userStatus?.streamProgressSeconds ?? 0
                            : Math.floor(data?.userStatus?.progress?.STREAM_ON_DESKTOP?.value ?? 0);

                        console.log(
                            `%cProgresso da transmissão: ${progress}/${secondsNeeded} segundos`,
                            "color: #58F0F7; font-size: 18px; font-weight: bold;",
                        );

                        if (progress >= secondsNeeded) {
                            console.log(
                                "%cQuest concluída!",
                                "color: #58F0F7; font-size: 18px; font-weight: bold;",
                            );

                            ApplicationStreamingStore.getStreamerActiveStreamMetadata = window.realFunc;
                            delete window.realFunc;

                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                            window.unsubscribeFn = null;

                            doJob();
                        }
                    };

                    window.unsubscribeFn = fn;
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                    console.log(
                        `%cTransmissão simulada para o aplicativo alvo. Aguarde ~${Math.ceil((secondsNeeded - secondsDone) / 60)} min.`,
                        "color: #58F0F7; font-size: 18px; font-weight: bold;",
                    );
                }

            } else if (taskName === "PLAY_ACTIVITY") {
                const channelId =
                    ChannelStore.getSortedPrivateChannels()[0]?.id ??
                    Object.values(GuildChannelStore.getAllGuilds())
                        .find(x => x != null && x.VOCAL?.length > 0)
                        ?.VOCAL?.[0]?.channel?.id;

                if (!channelId) {
                    console.warn(`[DiscordQuestPilot] Nenhum canal de voz disponível para: ${questName}`);
                    doJob();
                    return;
                }

                const streamKey = `call:${channelId}:1`;

                let fn = async () => {
                    try {
                        console.log(
                            `%cProcessando Quest: ${questName}`,
                            "color: #58F0F7; font-size: 18px; font-weight: bold;",
                        );

                        while (window.scriptExecutando) {
                            const res = await api.post({
                                url: `/quests/${quest.id}/heartbeat`,
                                body: {
                                    stream_key: streamKey,
                                    terminal: false,
                                },
                            });

                            const progress = res.body?.progress?.PLAY_ACTIVITY?.value ?? 0;

                            console.log(
                                `%cProgresso da atividade: ${progress}/${secondsNeeded} segundos`,
                                "color: #58F0F7; font-size: 18px; font-weight: bold;",
                            );

                            if (progress >= secondsNeeded) break;

                            await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                        }

                        if (window.scriptExecutando) {
                            await api.post({
                                url: `/quests/${quest.id}/heartbeat`,
                                body: {
                                    stream_key: streamKey,
                                    terminal: true,
                                },
                            });

                            console.log(
                                "%cQuest concluída!",
                                "color: #58F0F7; font-size: 18px; font-weight: bold;",
                            );

                            doJob();
                        }
                    } catch (error) {
                        console.error("[DiscordQuestPilot] Erro na Quest de atividade:", error);
                        doJob();
                    }
                };

                fn();
            }
        } catch (error) {
            console.error("[DiscordQuestPilot] Erro inesperado ao processar Quest:", error);
            doJob();
        }
    };

    doJob();
}
