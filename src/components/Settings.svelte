<script lang="ts">
    import { SwalAlert } from '$/lib/functions';
    import { invoke } from '@tauri-apps/api';
    import Button from './Button.svelte';
    import Icon from './Icon.svelte';
    import { Config, logged, SettingsOpened } from './Store.svelte';
    import Title from './Title.svelte';

    export const logout = async () => {
        try {
            await invoke('logout');
            SwalAlert({
                icon: 'success',
                title: 'Logged out successfully'
            });

            logged.set(false);
            SettingsOpened.set(false);
        } catch (_) {
            SwalAlert({
                icon: 'error',
                title: 'Unable to logout'
            });
        }
    };
</script>

<div class="flex flex-1 items-center justify-center">
    <div class="absolute top-0 flex w-full p-4">
        <button on:click={() => SettingsOpened.set(false)} class="ml-auto rounded-md p-2 transition-colors duration-200 hover:bg-secondary">
            <Icon name="bi-x-lg" class="text-4xl text-red-500" />
        </button>
    </div>
    <div class="flex h-auto w-1/2 flex-col gap-2 rounded-md border-2 border-gray-500 bg-secondary p-2">
        <Title>Settings</Title>
        <h2 class="text-xl font-medium">Logged in as: {$Config.display_name} ({$Config.username})</h2>
        <Button on:click={logout}>Logout</Button>
    </div>
</div>
