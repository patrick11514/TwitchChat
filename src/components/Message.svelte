<script lang="ts" context="module">
    import type { Source } from '$/lib/utils/Source';
    import { Tags } from '$/lib/utils/Tags';

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
    import { insertEmotes, insertMentions } from '$/lib/functions';
    import { Emotes } from '$/lib/utils/Emotes';
    import Badge from './Badge.svelte';
    import { DeletedMessages } from './ChatWindow.svelte';
    import Icon from './Icon.svelte';
    import Image from './Image.svelte';
    import { AllPeople, Config, replyingMessage, SevenTVData } from './Store.svelte';

    export let data: Message;
    export let controlls = true;

    const format = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    };

    const getAllMentions = (message: string): PartType[] => {
        const finds: {
            start: number;
            name: string;
            text: string;
        }[] = [];

        for (const username of [$Config.username, ...$AllPeople.map((u) => u.username)]) {
            if (!username) {
                continue;
            }

            let starts = message.toLocaleLowerCase().indexOfAll(username);

            if (starts.length === 0) {
                continue;
            }

            for (const start of starts) {
                if (start > 0 && message[start - 1] === '@') {
                    finds.push({
                        start: start - 1,
                        name: username,
                        text: `@${username}`
                    });
                } else {
                    finds.push({
                        start: start,
                        name: username,
                        text: username
                    });
                }
            }
        }

        return insertMentions(
            message,
            //Here we need to sort our finds by start, to correctly replace each find in message, because we replace them from left to right
            finds.toSorted((a, b) => (a.start > b.start ? 1 : -1))
        );
    };

    const findMention = (message: string): PartType[] => {
        return getAllMentions(message);
    };

    //Helper function to insert all emotes from different providers in message
    const insertAllEmotes = (message: string, emotes: Emotes | null) => {
        return $SevenTVData.fillEmotes(insertEmotes(message, emotes));
    };

    const parseMessage = (message: string, emotes: Emotes | null): PartType[] => {
        if (data.type !== 'chat') return [];
        //strip mention at the start if message is reply
        if (data.tags.has('reply-parent-msg-id')) {
            //check if starts with @
            if (message.startsWith('@')) {
                const space = message.indexOf(' ');
                //start message from start
                message = message.substring(space);
            }
        }

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

    const beginReply = () => {
        if (data.type !== 'chat') return;

        replyingMessage.set(data.tags.get('id'));
    };
</script>

{#if data.type === 'chat' && data.tags.has('reply-parent-msg-id')}
    <div class="flex w-full flex-row gap-2 px-2 py-0.5">
        <Icon name="bi-reply-fill" />
        <div class="w-full">
            Replying to: @{data.tags.get('reply-parent-display-name')}: {data.tags.get('reply-parent-msg-body')?.replaceAll('\\s', ' ')}
        </div>
    </div>
{/if}
<div
    class:bg-green-700={data.type === 'join'}
    class:bg-red-700={data.type === 'leave'}
    class:line-through={data.type === 'chat' && $DeletedMessages[data.tags.get('id') ?? '']}
    class:bg-red-900={data.type === 'chat' && hasMention(data.content)}
    class="group relative block items-center px-2 py-0.5 transition-colors duration-200 hover:bg-gray-500 hover:bg-opacity-50"
>
    {#if data.type === 'chat'}
        <span class="align-middle text-sm text-gray-400">{format(data.date)}</span>
        {#if data.tags.has('badges') && data.tags.get('badges')?.length}
            <div class="inline-flex flex-row gap-1 align-middle">
                {#each data.tags.getThrow('badges').each() as badge}
                    <Badge name={badge.name} badgesInfo={data.tags.get('badge-info')} badges={data.tags.get('badges')} />
                {/each}
            </div>
        {/if}
        <span style="color: {data.tags.get('color')};" class="align-middle font-bold">{data.tags.get('display-name')}:</span>
        <span class="align-middle">
            {#each parseMessage(data.content, data.tags.get('emotes')) as part}
                {#if part.type === 'message'}
                    {part.content}
                {:else if part.type === 'emote'}
                    <Image class="inline-block" src={part.url} alt={part.name} title={part.name} />
                {:else if part.type === 'mention'}
                    <span style="color: {part.color};" class="font-bold">{part.content}</span>
                {/if}
            {/each}
        </span>
        {#if controlls}
            <div class="absolute right-0 hidden -translate-y-1 items-center justify-center gap-2 px-2 align-middle text-xl group-hover:inline-flex">
                <button class="flex items-center justify-center" on:click={beginReply}>
                    <Icon name="bi-reply-fill" class="transition-color duration-200 hover:text-green-500" />
                </button>
            </div>
        {/if}
        {#if $DeletedMessages[data.tags.get('id') ?? '']}
            <span class="text-gray-400"> (Message deleted at {format($DeletedMessages[data.tags.get('id') ?? ''])})</span>
        {/if}
    {:else if data.type === 'join' || data.type == 'leave'}
        <span class="align-middle text-sm text-gray-400">{format(data.date)}</span>
        <span class="align-middle font-bold">{data.source.username} {data.type === 'join' ? 'joined' : 'left'} the chat</span>
    {/if}
</div>
