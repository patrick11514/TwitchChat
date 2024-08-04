<script lang="ts">
    import { DEFAULT_ASSETS } from '$/lib/functions';
    import type { Badges } from '$/lib/utils/Badges';
    import { getBadge } from './BottomBox.svelte';
    import Image from './Image.svelte';

    export let name: string | undefined;
    export let badgesInfo: Badges | null;
    export let badges: Badges | null;
    export let quality: 1 | 2 | 4 = 1;

    const badgeData = getBadge(name, 1, badgesInfo, badges);
    const title = badgeData ? ('name' in badgeData ? badgeData.name : badgeData?.title) : '';
</script>

{#if name !== undefined}
    <Image class="inline-block" src={badgeData?.[`image_url_${quality}x`]} alt={title} {title} />
{:else}
    <Image class="inline-block" src={DEFAULT_ASSETS.TWITCH_DEFAULT_BADGE} alt="No badge" title="No badge" />
{/if}
