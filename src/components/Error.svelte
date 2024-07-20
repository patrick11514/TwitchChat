<script lang="ts">
    import Title from './Title.svelte';

    export let title: string;
    export let text: string;
</script>

<div class="m-auto flex flex-col rounded-md bg-secondary p-4">
    <Title>{title}</Title>
    <h4 class="text-lg font-semibold">{text}</h4>
    <slot />
</div>
