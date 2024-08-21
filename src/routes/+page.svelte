<script lang="ts">
    import { logged } from '$/components/Store.svelte';
    import { SwalAlert } from '$/lib/functions';
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import LoginScreen from '../components/LoginScreen.svelte';
    import TwitchChat from '../components/TwitchChat.svelte';

    onMount(() => {
        check();
    });

    const check = async () => {
        try {
            logged.set(await invoke<boolean>('logged'));
        } catch (_) {
            SwalAlert({
                icon: 'error',
                title: 'Unable to retrieve informations.'
            });
        }
    };
</script>

{#if $logged}
    <TwitchChat />
{:else}
    <LoginScreen />
{/if}
