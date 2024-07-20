<script lang="ts">
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import LoginScreen from '../components/LoginScreen.svelte';

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
    Jsi lognutý :)
{:else}
    <LoginScreen />
{/if}

<button on:click={check}>Checkni to :)</button>
