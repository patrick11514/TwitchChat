<script lang="ts" context="module">
    export const getBadgeUrl = (name: string | null | undefined, quality: 1 | 2 | 4, version = 0): string | null => {
        if (name === undefined || name === null) {
            return null;
        }
        return get(GlobalBadges)[name]?.[version]?.[`image_url_${quality}x`];
    };
</script>

<script lang="ts">
    import { DEFAULT_ASSETS } from '$/lib/functions';
    import { Source } from '$/lib/utils/Source';
    import type { WS } from '$/lib/WebSocket';
    import { get } from 'svelte/store';
    import { Key } from 'ts-key-enum';
    import Button from './Button.svelte';
    import { Messages } from './ChatWindow.svelte';
    import Image from './Image.svelte';
    import { ChannelUserData, Config, CurrentChannel, GlobalBadges, RawChannelTags, UserData } from './Store.svelte';

    export let ws: WS;

    let message = '';

    const sendMessage = () => {
        if (!$CurrentChannel) {
            return;
        }

        ws.sendMessage($CurrentChannel, message);

        //add to message list
        Messages.set([
            ...$Messages,
            {
                date: new Date(),
                content: message,
                source: new Source(`${$Config.username}!localhost`),
                tags: $RawChannelTags
            }
        ]);

        message = '';
    };
</script>

<div class="flex flex-col gap-4 px-4 pb-4">
    <div class="flex flex-row gap-2 rounded-md border-2 border-gray-500 px-2 py-1">
        <div class="my-auto h-auto w-5">
            {#if $ChannelUserData.badges?.first()}
                <Image src={getBadgeUrl($ChannelUserData.badges.first()?.name, 1)} alt="badge" />
            {:else if $UserData.badges?.first()}
                <Image src={getBadgeUrl($UserData.badges.first()?.name, 1)} alt="badge" />
            {:else}
                <Image src={DEFAULT_ASSETS.TWITCH_DEFAULT_BADGE} alt="badge" />
            {/if}
        </div>
        <input
            bind:value={message}
            on:keypress={(ev) => {
                if (ev.key === Key.Enter) {
                    sendMessage();
                }
            }}
            type="text"
            class="bg-transparent outline-none"
            placeholder="Send message"
        />
    </div>
    <Button on:click={sendMessage} class="ml-auto w-28 text-lg">Odeslat</Button>
</div>
