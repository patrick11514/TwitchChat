<script lang="ts" context="module">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Message, { type Message as MessageType } from './Message.svelte';

    export const Messages = writable<MessageType[]>([]);
</script>

<script lang="ts">
    let Element: HTMLElement;

    onMount(() => {
        const observer = new MutationObserver(onMutate);
        observer.observe(Element, {
            childList: true
        });
    });

    const onMutate = (records: MutationRecord[]) => {
        for (const _ of records) {
            Element?.scrollBy({
                top: Element?.scrollHeight
            });
        }
    };
</script>

<section bind:this={Element} class="flex h-full w-full flex-1 flex-col overflow-y-auto py-2">
    {#each $Messages as message}
        <Message data={message} />
    {/each}
</section>
