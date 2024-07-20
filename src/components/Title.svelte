<script lang="ts">
    import { twMerge } from 'tailwind-merge';

    let cls = '';
    export { cls as class };
</script>

<h1 class={twMerge('mx-auto w-max border-b-4 border-b-primary font-poppins text-2xl font-bold', cls)}><slot /></h1>
