<script lang="ts">
    import { goto } from '$app/navigation';
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import Button from '../../components/Button.svelte';
    import Error from '../../components/Error.svelte';
    import Title from '../../components/Title.svelte';

    let failed = false;

    onMount(async () => {
        const data = window.location.hash.slice(1);
        const params = new URLSearchParams(data);

        if (!params.has('access_token')) {
            failed = true;
            return;
        }
        try {
            await invoke('save_token', { auth: params.get('access_token')! });
            goto('/');
        } catch (_) {
            failed = true;
        }
    });
</script>

{#if failed}
    <Error title="Twitch login failed" text="Login failed, if you want to retry login, click button bellow.">
        <Button on:click={() => goto('/')}>Back to home page</Button>
    </Error>
{:else}
    <Title class="my-auto">Waiting...</Title>
{/if}
