<script lang="ts" context="module">
    import type { Source } from '$/lib/utils/Source';
    import type { Tags } from '$/lib/utils/Tags';

    type ChatMessage = {
        //user part
        type: 'chat';
        date: Date;
        source: Source;
        tags: Tags;
        content: string;
    };

    type JoinMessage = {
        type: 'join';
        date: Date;
        source: Source;
    };

    type LeaveMessage = {
        type: 'leave';
        date: Date;
        source: Source;
    };

    export type Message = ChatMessage | JoinMessage | LeaveMessage;
</script>

<script lang="ts">
    import { Emotes } from '$/lib/utils/Emotes';
    import { getBadge } from './BottomBox.svelte';
    import { DeletedMessages } from './ChatWindow.svelte';
    import Image from './Image.svelte';

    export let data: Message;

    const format = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    };

    type PartType =
        | {
              type: 'message';
              content: string;
          }
        | {
              type: 'emote';
              url: string;
          };

    const parseMessage = (message: string, emotes: Emotes | null): PartType[] => {
        if (emotes === null) {
            return [
                {
                    type: 'message',
                    content: message
                }
            ];
        }

        let currentIndex = 0;
        const parts: PartType[] = [];

        for (const emote of emotes.each()) {
            const cut = message.substring(currentIndex, emote.textStart);

            if (cut.length > 0) {
                parts.push({
                    type: 'message',
                    content: cut
                });
            }

            parts.push({
                type: 'emote',
                //Universal emote url
                url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.name}/default/light/1.0`
            });

            currentIndex = emote.textEnd + 1;
        }

        parts.push({
            type: 'message',
            content: message.substring(currentIndex, message.length)
        });

        return parts;
    };
</script>

<div
    class:bg-green-700={data.type === 'join'}
    class:bg-red-700={data.type === 'leave'}
    class:line-through={data.type === 'chat' && $DeletedMessages[data.tags.get('id') ?? '']}
    class="block flex-wrap items-center gap-2 bg-transparent px-2 py-0.5 transition-colors duration-200 hover:bg-gray-500 hover:bg-opacity-50"
>
    {#if data.type === 'chat'}
        <span class="align-middle text-sm text-gray-400">{format(data.date)}</span>
        {#if data.tags.has('badges') && data.tags.get('badges')?.length}
            <div class="inline-flex flex-row gap-1 align-middle">
                {#each data.tags.getThrow('badges').each() as badge}
                    <Image class="inline-block" src={getBadge(badge.name, 1, data.tags.get('badge-info'), data.tags.get('badges'))} alt="badge" />
                {/each}
            </div>
        {/if}
        <span style="color: {data.tags.get('color')};" class="align-middle font-bold">{data.tags.get('display-name')}:</span>
        <span class="align-middle">
            {#each parseMessage(data.content, data.tags.get('emotes')) as part}
                {#if part.type === 'message'}
                    {part.content}
                {:else if part.type === 'emote'}
                    <Image class="inline-block" src={part.url} alt="Emote" />
                {/if}
            {/each}
        </span>
        {#if $DeletedMessages[data.tags.get('id') ?? '']}
            <span class="text-gray-400"> (Message deleted at {format($DeletedMessages[data.tags.get('id') ?? ''])})</span>
        {/if}
    {:else if data.type === 'join' || data.type == 'leave'}
        <span class="align-middle text-sm text-gray-400">{format(data.date)}</span>
        <span class="align-middle font-bold">{data.source.username} {data.type === 'join' ? 'joined' : 'left'} the chat</span>
    {/if}
</div>
