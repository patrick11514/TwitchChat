<script lang="ts">
    export let src: string | null | undefined;
    export let alt: string;
    export let title = '';
    let cls = '';
    export { cls as class };
</script>

<img on:dragstart|preventDefault class={cls} {src} {alt} {title} />
