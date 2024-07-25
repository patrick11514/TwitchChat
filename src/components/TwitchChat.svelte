<script lang="ts">
    import { SwalAlert } from '$/lib/functions';
    import type { Badges } from '$/lib/utils/Badges';
    import { WS } from '$/lib/WebSocket';
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Button from './Button.svelte';
    import Input from './Input.svelte';
    import Title from './Title.svelte';

    type Config = {
        username: string;
        display_name: string;
        token: string;
    };

    let config: Config;

    onMount(async () => {
        try {
            config = await invoke<Config>('get_config');

            setupWebsocket();
        } catch (_) {
            SwalAlert({
                icon: 'error',
                title: 'Unable to load config, try again'
            });
        }
    });

    const userData = writable<{
        id: string;
        displayName: string;
        badges: Badges;
    }>();

    let currentChannel: string | null = null;
    let ready = false;
    let ws: WS;

    const setupWebsocket = async () => {
        ws = new WS(config.username, config.token);
        ws.on('auth', () => {
            ready = true;
        });
        ws.on('message', (tags, source, command, params) => {
            if (command.isType('PING')) {
                ws.send('PONG', undefined);
            }

            if (command.isType('JOIN')) {
                if (!source) {
                    return;
                }

                if (!('host' in source)) {
                    return;
                }
                currentChannel = source.username;
            }

            if (command.isType('GLOBALUSERSTATE')) {
                if (!source || !tags) {
                    return;
                }

                if (!('host' in source)) {
                    return;
                }

                if (!tags.has('badges') || !tags.has('display-name') || !tags.has('user-id')) {
                    return;
                }

                userData.set({
                    id: tags.get('user-id')!,
                    displayName: tags.get('display-name')!,
                    badges: tags.get('badges')!
                });
            }

            if (command.isType('PART')) {
                console.log(source, tags, params);
            }

            if (command.isType('PRIVMSG')) {
                console.log(source, params);
            }
        });
    };

    let newChannel = '';

    const joinChannel = () => {
        if (newChannel.length == 0) {
            SwalAlert({
                icon: 'error',
                title: 'Enter channel name'
            });
            return;
        }

        if (!ready) {
            SwalAlert({
                icon: 'error',
                title: 'Websocket is not ready'
            });
            return;
        }

        ws.joinRoom(newChannel);
    };

    const logout = () => {
        if (!currentChannel) {
            SwalAlert({
                icon: 'error',
                title: 'You are not connected to any channel'
            });
            return;
        }

        if (!ready) {
            SwalAlert({
                icon: 'error',
                title: 'Websocket is not ready'
            });
            return;
        }

        ws.leaveRoom(currentChannel);
    };
</script>

{#if config}
    {#if !$userData}
        <Title class="my-auto">Loading...</Title>
    {:else if !currentChannel}
        <div class="flex flex-1 flex-col items-center justify-center gap-2">
            <Title>Enter channel name</Title>
            <Input bind:value={newChannel} />
            <Button on:click={joinChannel}>Enter</Button>
        </div>
    {:else}
        <section class="flex flex-1 flex-col">
            <div class="flex w-full flex-row items-center justify-between gap-2 border-b-2 border-b-gray-500 p-2">
                <h2 class="text-center font-poppins text-xl font-bold">Connected to <span>{currentChannel}</span></h2>
                <Button on:click={logout}>Logout</Button>
            </div>
            <div class="mt-auto flex flex-col p-4">
                <div class="flex flex-row gap-2 rounded-md border-2 border-gray-500 px-2 py-1">
                    <div class="">
                        <img src="" />
                    </div>
                    <input type="text" class="bg-transparent outline-none" placeholder="Send meessage" />
                </div>
            </div>
        </section>
    {/if}
{/if}
