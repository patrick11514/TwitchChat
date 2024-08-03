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

    export type PartType =
        | {
              type: 'message';
              content: string;
          }
        | {
              type: 'emote';
              name: string;
              url: string;
          }
        | {
              type: 'mention';
              content: string;
              color: string;
          };
</script>

<script lang="ts">
    import { insertEmotes } from '$/lib/functions';
    import { Emotes } from '$/lib/utils/Emotes';
    import { getBadge } from './BottomBox.svelte';
    import { DeletedMessages } from './ChatWindow.svelte';
    import Image from './Image.svelte';
    import { AllPeople, Config, PeopleSettings, SevenTVData } from './Store.svelte';

    export let data: Message;

    const format = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    };

    const mensionizeMessage = (message: string, name: string): string | PartType[] => {
        const parts: PartType[] = [];

        let find = name;
        let start = message.toLocaleLowerCase().indexOf(find);

        if (start == -1) {
            return message;
        }

        //check for @
        if (start > 0 && message[start - 1] === '@') {
            //move start to @
            --start;
            find = '@' + find;
        }

        const pre = message.substring(0, start);
        if (pre.length > 0) {
            parts.push({
                type: 'message',
                content: pre
            });
        }

        let displayName = find;
        let color = '#ffffff';

        if (name in $PeopleSettings) {
            displayName = displayName.replace(name, $PeopleSettings[name].displayName);
            color = $PeopleSettings[name].color;
        }

        parts.push({
            type: 'mention',
            content: displayName,
            color: color
        });

        const endIndex = start + find.length;
        const past = message.substring(endIndex);

        if (past.length > 0) {
            parts.push({
                type: 'message',
                content: past
            });
        }

        return parts;
    };

    const findMention = (message: string): PartType[] => {
        for (const username of [$Config.username, ...$AllPeople.map((u) => u.username)]) {
            if (!username) {
                continue;
            }

            const data = mensionizeMessage(message, username);

            if (typeof data === 'string') {
                continue;
            }

            return data;
        }

        return [
            {
                type: 'message',
                content: message
            }
        ];
    };

    //Helper function to insert all emotes from different providers in message
    const insertAllEmotes = (message: string, emotes: Emotes | null) => {
        return $SevenTVData.fillEmotes(insertEmotes(message, emotes));
    };

    const parseMessage = (message: string, emotes: Emotes | null): PartType[] => {
        let parts: PartType[] = [];

        for (const part of insertAllEmotes(message, emotes)) {
            if (part.type === 'message') {
                parts = parts.concat(findMention(part.content));
            } else {
                parts.push(part);
            }
        }

        return parts;
    };

    const hasMention = (message: string) => {
        return message.toLocaleLowerCase().includes($Config.username);
    };
</script>

<div
    class:bg-green-700={data.type === 'join'}
    class:bg-red-700={data.type === 'leave'}
    class:line-through={data.type === 'chat' && $DeletedMessages[data.tags.get('id') ?? '']}
    class:bg-red-900={data.type === 'chat' && hasMention(data.content)}
    class="block flex-wrap items-center gap-2 bg-transparent px-2 py-0.5 transition-colors duration-200 hover:bg-gray-500 hover:bg-opacity-50"
>
    {#if data.type === 'chat'}
        <span class="align-middle text-sm text-gray-400">{format(data.date)}</span>
        {#if data.tags.has('badges') && data.tags.get('badges')?.length}
            <div class="inline-flex flex-row gap-1 align-middle">
                {#each data.tags.getThrow('badges').each() as badge}
                    <Image class="inline-block" src={getBadge(badge.name, 1, data.tags.get('badge-info'), data.tags.get('badges'))} alt={badge.name} />
                {/each}
            </div>
        {/if}
        <span style="color: {data.tags.get('color')};" class="align-middle font-bold">{data.tags.get('display-name')}:</span>
        <span class="align-middle">
            {#each parseMessage(data.content, data.tags.get('emotes')) as part}
                {#if part.type === 'message'}
                    {part.content}
                {:else if part.type === 'emote'}
                    <Image class="inline-block" src={part.url} alt={part.name} />
                {:else if part.type === 'mention'}
                    <span style="color: {part.color};" class="font-bold">{part.content}</span>
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
