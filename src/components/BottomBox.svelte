<script lang="ts" context="module">
    export const getBadge = (name: string | null | undefined, quality: 1 | 2 | 4, info: Badges | null, badges: Badges | null) => {
        if (name === undefined || name === null || badges === null) {
            return null;
        }

        if (info && info.has(name) && name !== 'predictions') {
            return getBadgeData(name, quality, info.get(name)!.id);
        }

        return getBadgeData(name, quality, badges.get(name)!.id);
    };

    export const getBadgeData = (name: string | null | undefined, quality: 1 | 2 | 4, s_version = '1') => {
        if (name === undefined || name === null) {
            return null;
        }

        //first check the channel badges

        type BadgeData = Record<
            string,
            | {
                  image_url_1x: string;
                  image_url_2x: string;
                  image_url_4x: string;
                  name: string;
              }
            | {
                  image_url_1x: string;
                  image_url_2x: string;
                  image_url_4x: string;
                  title: string;
              }
        >;

        let channelBadge: BadgeData = get(ChannelBadges)[name];

        if (!channelBadge) {
            channelBadge = get(GlobalBadges)[name] as unknown as BadgeData;
        }

        const version = parseInt(s_version);

        if (isNaN(version)) {
            return channelBadge[s_version];
        }

        let lowest = 0;
        for (const ver of Object.keys(channelBadge)) {
            const parsed = parseInt(ver);
            if (parsed > lowest) {
                if (parsed <= version) {
                    lowest = parsed;
                } else {
                    break;
                }
            }
        }

        return channelBadge[lowest];
    };

    export type FoundEmote = {
        name: string;
        platform: 'twitch' | '7tv';
        preview: string;
    };
</script>

<script lang="ts">
    import type { WS } from '$/lib/WebSocket';
    import type { Badges } from '$/lib/utils/Badges';
    import { get } from 'svelte/store';
    import { Key } from 'ts-key-enum';
    import Badge from './Badge.svelte';
    import Button from './Button.svelte';
    import { Messages } from './ChatWindow.svelte';
    import Icon from './Icon.svelte';
    import Image from './Image.svelte';
    import type { Message as MessageType } from './Message.svelte';
    import Message from './Message.svelte';
    import { ChannelBadges, ChannelUserData, CurrentChannel, GlobalBadges, GlobalEmotes, PeopleSettings, replyingMessage, SevenTVData, UserData } from './Store.svelte';

    export let ws: WS;

    let message = '';
    let currentHistory = 0;
    let currentMessage = '';
    const messageHistory: string[] = [];

    const sendMessage = () => {
        if (!$CurrentChannel) {
            return;
        }

        if ($replyingMessage) {
            ws.reply($CurrentChannel, message, $replyingMessage);
            replyingMessage.set(null);
        } else {
            ws.sendMessage($CurrentChannel, message);
        }

        messageHistory.push(message);
        currentHistory = messageHistory.length;

        message = '';
    };

    let showMentionPicker = false;
    let mentionTyped = '';

    const watchMessage = (msg: string) => {
        const lastAt = msg.split('').toReversed().join('').indexOf('@');

        if (lastAt === -1) {
            showMentionPicker = false;
            return;
        }

        const position = msg.length - 1 - lastAt;

        if (msg.substring(position).includes(' ')) {
            showMentionPicker = false;
            mentionTyped = '';
        } else {
            showMentionPicker = true;
            mentionTyped = msg.substring(position + 1);
        }
    };

    $: watchMessage(message);

    const generateMentionList = (text: string) => {
        return Object.entries($PeopleSettings).filter(([name, _]) => name.startsWith(text) && text.length !== name.length);
    };

    const mentionEntries = (text: string) => {
        return Object.keys($PeopleSettings).filter((name) => name.startsWith(text) && text.length !== name.length).length;
    };

    const fillMention = (name: string) => {
        message = message.substring(0, message.length - mentionTyped.length) + name;
    };

    const clickMention = (name: string) => {
        fillMention(name);
        input.focus();
    };

    let input: HTMLInputElement;
    let buttons: HTMLButtonElement[] = [];

    let selected = 0;
    let selectingEmote = false;
    let currentEmoteSelectionText = '';

    let foundEmoteIndex = 0;
    let foundEmotes: FoundEmote[] = [];
    let foundElms: HTMLButtonElement[] = [];

    const inputOnKey = (
        ev: KeyboardEvent & {
            currentTarget: EventTarget & HTMLInputElement;
        }
    ) => {
        const handleKeys = [Key.ArrowDown, Key.ArrowUp, Key.Enter, Key.Tab, Key.Escape];

        if (handleKeys.includes(ev.key as Key)) {
            ev.preventDefault();
        }

        if (ev.key === Key.Escape && $replyingMessage) {
            replyingMessage.set(null);
            return;
        }

        const buttonsFilter = buttons.filter((btn) => btn);

        if (ev.key === Key.ArrowDown) {
            if (showMentionPicker) {
                if (selected < buttonsFilter.length - 1) {
                    selected++;
                }
            } else {
                if (currentHistory < messageHistory.length) {
                    currentHistory++;

                    message = messageHistory[currentHistory] ?? currentMessage;
                }
            }
            return;
        }

        if (ev.key === Key.ArrowUp) {
            if (showMentionPicker) {
                if (selected > 0) {
                    selected--;
                }
            } else {
                if (currentHistory > 0) {
                    if (currentHistory === messageHistory.length) {
                        currentMessage = message;
                    }

                    currentHistory--;

                    message = messageHistory[currentHistory];
                }
            }
            return;
        }

        if (ev.key === Key.Enter) {
            if (showMentionPicker && mentionEntries(mentionTyped) > 0) {
                buttonsFilter[selected].click();
            } else {
                sendMessage();
            }

            //hide emote select when message was sent
            selectingEmote = false;
            return;
        }

        if (ev.key === Key.Tab) {
            if (!selectingEmote) {
                const space = message.split('').toReversed().join('').indexOf(' ');

                if (space === -1) {
                    currentEmoteSelectionText = message;
                } else {
                    currentEmoteSelectionText = message.substring(message.length - space);
                }
            }

            if (currentEmoteSelectionText.trim().length == 0) {
                return;
            }

            if (!selectingEmote) {
                selectingEmote = true;

                //find all emotes
                const fullEmoteList: FoundEmote[] = [
                    ...Object.values($GlobalEmotes).map((emote) => {
                        return {
                            name: emote.name,
                            platform: 'twitch',
                            preview: emote.urls.url_4x
                        } satisfies FoundEmote;
                    }),
                    ...Object.keys($SevenTVData.cache).map((emote) => {
                        const root = $SevenTVData.getEmote(emote)?.data.host.url;
                        const path = $SevenTVData
                            .getEmote(emote)
                            ?.data.host.files.toReversed()
                            .find((file) => file.format === 'WEBP')?.name;

                        return {
                            name: emote,
                            platform: '7tv',
                            preview: `${root}/${path}`
                        } satisfies FoundEmote;
                    })
                ];

                const selectionLower = currentEmoteSelectionText.toLocaleLowerCase();

                foundEmotes = fullEmoteList.filter((emote) => emote.name.toLocaleLowerCase().startsWith(selectionLower));
                foundEmoteIndex = 0;

                if (foundEmotes[foundEmoteIndex]) {
                    message = message.substring(0, message.length - currentEmoteSelectionText.length) + foundEmotes[foundEmoteIndex].name;
                }
            } else {
                //may be usefull when I prevent SHIFT + Tab and use it for back scrolling
                if (ev.shiftKey) {
                    if (foundEmoteIndex === 0) {
                        selectEmote(foundEmotes.length - 1);
                    } else {
                        selectEmote(foundEmoteIndex - 1);
                    }
                } else {
                    if (foundEmoteIndex === foundEmotes.length - 1) {
                        selectEmote(0);
                    } else {
                        selectEmote(foundEmoteIndex + 1);
                    }
                }
            }

            return;
        }

        selected = 0;
        selectingEmote = false;
    };

    const channelBadge = $ChannelUserData.badges.first();
    const userBadge = $UserData.badges?.first();

    const selectEmote = (index: number) => {
        if (!foundEmotes[foundEmoteIndex]) return;

        const prev = foundEmoteIndex;
        foundEmoteIndex = index;

        foundElms[foundEmoteIndex]?.scrollIntoView();
        message = message.substring(0, message.length - foundEmotes[prev].name.length) + foundEmotes[foundEmoteIndex].name;
    };

    //if we select reply to message, autofocus input
    replyingMessage.subscribe((value) => {
        if (value) {
            input?.focus();
        }
    });

    let replyMessageData: undefined | MessageType;
    $: replyMessageData = $Messages.find((message) => message.type === 'chat' && message.tags.get('id') === $replyingMessage);
</script>

<div class="flex flex-col gap-4 px-4 pb-4">
    {#if showMentionPicker && mentionEntries(mentionTyped) > 0}
        <div class="z-10 flex w-full flex-col rounded-md border-2 border-gray-500">
            {#each generateMentionList(mentionTyped) as [name, options], id}
                <button
                    bind:this={buttons[id]}
                    class:bg-gray-400={id === selected}
                    on:click={() => clickMention(name)}
                    class="cursor-pointer px-2 py-0.5 text-left transition-colors duration-200 hover:bg-gray-500"
                >
                    {options.displayName}
                </button>
            {/each}
        </div>
    {/if}

    <div class="flex flex-col rounded-md border-2 border-gray-500 px-2 py-1">
        {#if $replyingMessage}
            <div class="flex w-full flex-col">
                <div class="flex w-full">
                    <h2 class="font-poppins text-lg font-bold">Replying to:</h2>
                    <button on:click={() => replyingMessage.set(null)} class="ml-auto text-2xl text-red-500"><Icon name="bi-x-lg" /></button>
                </div>
                {#if replyMessageData}
                    <Message data={replyMessageData} />
                {/if}
            </div>
        {/if}
        <div class="flex flex-row gap-2">
            <div class="my-auto h-auto w-5">
                <Badge name={channelBadge ? channelBadge.name : userBadge ? userBadge.name : undefined} badgesInfo={$ChannelUserData.badgeInfo} badges={$ChannelUserData.badges} />
            </div>
            {#if selectingEmote}
                <section class="absolute bottom-28 left-0 z-20 flex w-full items-center justify-center">
                    <div class="mx-auto flex w-[60%] min-w-80 items-center justify-center whitespace-nowrap">
                        <div
                            class="inline-block w-max max-w-full flex-row items-center justify-center self-center overflow-x-auto whitespace-nowrap rounded-md border-2 border-gray-500 bg-secondary p-2"
                        >
                            {#if foundEmotes.length == 0}
                                <span class="font-poppins font-bold text-red-500">No emote found :(</span>
                            {:else}
                                {#each foundEmotes as emote, i}
                                    <button
                                        bind:this={foundElms[i]}
                                        class:bg-primary={i === foundEmoteIndex}
                                        class="mx-1 inline-flex aspect-square h-24 w-24 flex-col items-center justify-between overflow-x-hidden rounded-md transition-colors duration-150 hover:bg-primary"
                                        on:click={() => selectEmote(i)}
                                    >
                                        <div class="flex h-full w-full">
                                            <Image class="m-auto h-16 w-auto" src={emote.preview} alt={emote.name} title={emote.name} />
                                        </div>
                                        <span class="overflow-ellipsis align-middle font-poppins font-bold">{emote.name}</span>
                                    </button>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </section>
            {/if}
            <input bind:this={input} bind:value={message} on:keydown={inputOnKey} type="text" class="w-full bg-transparent outline-none" placeholder="Send message" />
        </div>
    </div>
    <Button on:click={sendMessage} class="ml-auto w-28 text-lg">Odeslat</Button>
</div>
