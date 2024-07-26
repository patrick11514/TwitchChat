<script lang="ts">
    import { DEFAULT_ASSETS } from '$/lib/functions';
    import type { WS } from '$/lib/WebSocket';
    import { Key } from 'ts-key-enum';
    import Button from './Button.svelte';
    import Image from './Image.svelte';
    import { ChannelUserData, CurrentChannel, GlobalBadges, UserData } from './Store.svelte';

    export let ws: WS;

    const getBadgeUrl = (name: string | undefined, quality: 1 | 2 | 4, version = 0): string | null => {
        if (name === undefined) {
            return null;
        }
        return $GlobalBadges[name]?.[version]?.[`image_url_${quality}x`];
    };

    let message = '';

    const sendMessage = () => {
        if (!$CurrentChannel) {
            return;
        }

        ws.sendMessage($CurrentChannel, message);
        message = '';
    };
</script>

<div class="mt-auto flex flex-col gap-4 p-4">
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
            placeholder="Send meessage"
        />
    </div>
    <Button on:click={sendMessage} class="ml-auto w-28 text-lg">Odeslat</Button>
</div>
