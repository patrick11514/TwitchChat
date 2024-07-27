<script lang="ts" context="module">
    import type { Source } from '$/lib/utils/Source';
    import type { Tags } from '$/lib/utils/Tags';
    import { getBadgeUrl } from './BottomBox.svelte';

    export type Message = {
        //user part
        date: Date;
        source: Source;
        tags: Tags;
        content: string;
    };
</script>

<script lang="ts">
    import Image from './Image.svelte';

    export let data: Message;

    const format = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    };
</script>

<div class="block flex-wrap items-center gap-2 bg-transparent px-2 py-0.5 transition-colors duration-200 hover:bg-gray-500 hover:bg-opacity-50">
    <span class="align-middle text-sm text-gray-400">{format(data.date)}</span>
    {#if data.tags.has('badges') && data.tags.get('badges')?.length}
        <div class="inline-flex flex-row gap-1 align-middle">
            {#each data.tags.getThrow('badges').each() as badge}
                <Image class="inline-block" src={getBadgeUrl(badge.name, 1)} alt="badge" />
            {/each}
        </div>
    {/if}
    <span style="color: {data.tags.get('color')};" class="align-middle font-bold">{data.tags.get('display-name')}:</span>
    <span class="align-middle">{data.content}</span>
    <!--{JSON.stringify(data.tags)}!-->
</div>
