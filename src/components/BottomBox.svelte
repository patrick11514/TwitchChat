<script lang="ts" context="module">
    export const getBadge = (name: string | null | undefined, quality: 1 | 2 | 4, info: Badges | null, badges: Badges | null) => {
        if (name === undefined || name === null || badges === null) {
            return null;
        }

        if (info && info.has(name) && name !== 'predictions') {
            return getBadgeUrl(name, quality, info.get(name)!.id);
        }

        return getBadgeUrl(name, quality, badges.get(name)!.id);
    };

    export const getBadgeUrl = (name: string | null | undefined, quality: 1 | 2 | 4, s_version = '1'): string | null => {
        if (name === undefined || name === null) {
            return null;
        }

        //first check the channel badges

        type BadgeData = Record<
            string,
            {
                image_url_1x: string;
                image_url_2x: string;
                image_url_4x: string;
            }
        >;

        let channelBadge: BadgeData = get(ChannelBadges)[name];

        if (!channelBadge) {
            channelBadge = get(GlobalBadges)[name] as unknown as BadgeData;
        }

        const version = parseInt(s_version);

        if (isNaN(version)) {
            console.log(channelBadge, s_version);

            return channelBadge[s_version]?.[`image_url_${quality}x`];
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

        if (name === 'sub-gifter') {
            //console.log(name, lowest, version);
        }

        return channelBadge[lowest]?.[`image_url_${quality}x`];
    };
</script>

<script lang="ts">
    import { DEFAULT_ASSETS } from '$/lib/functions';
    import type { Badges } from '$/lib/utils/Badges';
    import type { WS } from '$/lib/WebSocket';
    import { get } from 'svelte/store';
    import { Key } from 'ts-key-enum';
    import Button from './Button.svelte';
    import Image from './Image.svelte';
    import { ChannelBadges, ChannelUserData, CurrentChannel, GlobalBadges, UserData } from './Store.svelte';

    export let ws: WS;

    let message = '';

    const sendMessage = () => {
        if (!$CurrentChannel) {
            return;
        }

        ws.sendMessage($CurrentChannel, message);
        message = '';
    };
</script>

<div class="flex flex-col gap-4 px-4 pb-4">
    <div class="flex flex-row gap-2 rounded-md border-2 border-gray-500 px-2 py-1">
        <div class="my-auto h-auto w-5">
            {#if $ChannelUserData.badges?.first()}
                <Image src={getBadge($ChannelUserData.badges.first()?.name, 1, $ChannelUserData.badgeInfo, $ChannelUserData.badges)} alt="badge" />
            {:else if $UserData.badges?.first()}
                <Image src={getBadge($UserData.badges.first()?.name, 1, $ChannelUserData.badgeInfo, $ChannelUserData.badges)} alt="badge" />
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
            class="w-full bg-transparent outline-none"
            placeholder="Send message"
        />
    </div>
    <Button on:click={sendMessage} class="ml-auto w-28 text-lg">Odeslat</Button>
</div>
