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
</script>

<script lang="ts">
    import type { WS } from '$/lib/WebSocket';
    import type { Badges } from '$/lib/utils/Badges';
    import { get } from 'svelte/store';
    import { Key } from 'ts-key-enum';
    import Badge from './Badge.svelte';
    import Button from './Button.svelte';
    import { ChannelBadges, ChannelUserData, CurrentChannel, GlobalBadges, PeopleSettings, UserData } from './Store.svelte';

    export let ws: WS;

    let message = '';

    const sendMessage = () => {
        if (!$CurrentChannel) {
            return;
        }

        ws.sendMessage($CurrentChannel, message);
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

    const inputOnKey = (
        ev: KeyboardEvent & {
            currentTarget: EventTarget & HTMLInputElement;
        }
    ) => {
        const handleKeys = [Key.ArrowDown, Key.ArrowUp, Key.Enter, Key.Tab];

        if (handleKeys.includes(ev.key as Key)) {
            ev.preventDefault();
        }

        const buttonsFilter = buttons.filter((btn) => btn);

        if (ev.key === Key.ArrowDown) {
            if (selected < buttonsFilter.length - 1) {
                selected++;
            }
            return;
        }

        if (ev.key === Key.ArrowUp) {
            if (selected > 0) {
                selected--;
            }
            return;
        }

        if (ev.key === Key.Enter) {
            if (showMentionPicker && mentionEntries(mentionTyped) > 0) {
                buttonsFilter[selected].click();
            } else {
                sendMessage();
            }
            return;
        }

        selected = 0;
    };

    const channelBadge = $ChannelUserData.badges.first();
    const userBadge = $UserData.badges?.first();
</script>

<div class="flex flex-col gap-4 px-4 pb-4">
    {#if showMentionPicker && mentionEntries(mentionTyped) > 0}
        <div class="flex w-full flex-col rounded-md border-2 border-gray-500">
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
    <div class="flex flex-row gap-2 rounded-md border-2 border-gray-500 px-2 py-1">
        <div class="my-auto h-auto w-5">
            <Badge name={channelBadge ? channelBadge.name : userBadge ? userBadge.name : undefined} badgesInfo={$ChannelUserData.badgeInfo} badges={$ChannelUserData.badges} />
        </div>
        <input bind:this={input} bind:value={message} on:keydown={inputOnKey} type="text" class="w-full bg-transparent outline-none" placeholder="Send message" />
    </div>
    <Button on:click={sendMessage} class="ml-auto w-28 text-lg">Odeslat</Button>
</div>
