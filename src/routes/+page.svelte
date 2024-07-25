<script lang="ts">
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import LoginScreen from '../components/LoginScreen.svelte';
    import TwitchChat from '../components/TwitchChat.svelte';

    let logged = false;

    onMount(() => {
        check();
    });

    const check = async () => {
        try {
            logged = await invoke<boolean>('logged');
        } catch (_) {
            console.log(_);
        }
    };
</script>

{#if logged}
    <TwitchChat />
{:else}
    <LoginScreen />
{/if}
