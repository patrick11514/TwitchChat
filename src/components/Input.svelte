<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';
    import { twMerge } from 'tailwind-merge';

    export let type: HTMLInputAttributes['type'] = 'text';
    export let value = '';
    export let id = '';
    let cls = '';
    export { cls as class };
</script>

<input {id} on:input on:input={(ev) => (value = ev.currentTarget.value)} {type} {value} class={twMerge(' text-t rounded-md bg-primary px-2 py-1 font-medium', cls)} />
