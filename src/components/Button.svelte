<script lang="ts">
    import type { HTMLButtonAttributes } from 'svelte/elements';
    import { twMerge } from 'tailwind-merge';

    export let type: HTMLButtonAttributes['type'] = 'button';
    let cls = '';
    export { cls as class };
</script>

<button {type} on:click class={twMerge('font-poppins bg-primary hover:bg-accent rounded-md px-2 py-1 text-xl font-bold transition-all duration-200 active:translate-y-1', cls)}>
    <slot />
</button>
