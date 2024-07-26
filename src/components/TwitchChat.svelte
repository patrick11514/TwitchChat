<script lang="ts">
    import { customFetch, SwalAlert } from '$/lib/functions';
    import type { Badges } from '$/lib/utils/Badges';
    import { WS } from '$/lib/WebSocket';
    import { PUBLIC_CLIENT_ID } from '$env/static/public';
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import z from 'zod';
    import Button from './Button.svelte';
    import Input from './Input.svelte';
    import Title from './Title.svelte';

    type Config = {
        username: string;
        display_name: string;
        token: string;
    };

    let config: Config;

    //global badges
    const globalBadgeVersionSchema = z.array(
        z.object({
            id: z.string(),
            image_url_1x: z.string(),
            image_url_2x: z.string(),
            image_url_4x: z.string(),
            title: z.string(),
            description: z.string()
        })
    );
    let globalBadges: Record<string, z.infer<typeof globalBadgeVersionSchema>> = {};

    const init = async () => {
        try {
            config = await invoke<Config>('get_config');

            setupWebsocket();
        } catch (_) {
            SwalAlert({
                icon: 'error',
                title: 'Unable to load config, try again'
            });
        }

        //get badges
        const badges = await customFetch(
            'https://api.twitch.tv/helix/chat/badges/global',
            {
                method: 'GET',
                headers: {
                    'Client-Id': PUBLIC_CLIENT_ID,
                    Authorization: `Bearer ${config.token}`
                }
            },
            z.object({
                data: z.array(
                    z.object({
                        set_id: z.string(),
                        versions: globalBadgeVersionSchema
                    })
                )
            })
        );

        if (badges === null || badges instanceof z.ZodError) {
            return;
        }

        for (const badge of badges.data) {
            globalBadges[badge.set_id] = badge.versions;
        }
    };

    onMount(() => {
        init();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    });

    const userData = writable<{
        id: string;
        displayName: string;
        badges: Badges;
    }>();

    const channelUserData = writable<{
        badges: Badges;
        badgeInfo: Badges;
        mod: boolean;
        subscriber: boolean;
    }>();

    let currentChannel: string | null = null;
    let ready = false;
    let ws: WS;

    const setupWebsocket = async () => {
        ws = new WS(config.username, config.token);
        ws.on('auth', () => {
            ready = true;

            //TODO: REMOVE AUTO JOIN TO CHANNEL
            ws.joinRoom('PatrikMint');
        });
        ws.on('message', (tags, source, command, params) => {
            if (command.isType('PING')) {
                ws.send('PONG', undefined);
            }

            //USER JOIN TO CHANNEL EVENT
            if (command.isType('JOIN')) {
                if (!source) {
                    return;
                }

                //if username is same as me, then I sucessfully joined channel
                if (source.username === config.username) {
                    currentChannel = command.data;
                    return;
                }

                return;
            }

            //USER LEAVEE CHANNEL EVENT
            if (command.isType('PART')) {
                if (!source) {
                    return;
                }

                //if username is same as me, then I sucessfully left channel
                if (source.username === config.username) {
                    currentChannel = null;
                    return;
                }

                return;
            }

            if (command.isType('PRIVMSG')) {
                console.log(source, params);
            }

            //get info about me, which badge I have set, my user id, display name etc...
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

            if (command.isType('USERSTATE')) {
                if (!tags) {
                    return;
                }

                if (!tags.has('badge-info') || !tags.has('badges') || !tags.has('mod') || !tags.has('subscriber')) {
                    return;
                }

                channelUserData.set({
                    badgeInfo: tags.get('badge-info')!,
                    badges: tags.get('badges')!,
                    mod: tags.get('mod')!,
                    subscriber: tags.get('subscriber')!
                });
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
        newChannel = '';
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

    const getBadgeUrl = (name: string | undefined, quality: 1 | 2 | 4, version = 0): string | null => {
        if (name === undefined) {
            return null;
        }
        return globalBadges[name]?.[version]?.[`image_url_${quality}x`];
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
    {:else if $channelUserData}
        <section class="flex flex-1 flex-col">
            <div class="flex w-full flex-row items-center justify-between gap-2 border-b-2 border-b-gray-500 p-2">
                <h2 class="text-center font-poppins text-xl font-bold">Connected to <span>{currentChannel}</span></h2>
                <Button on:click={logout}>Logout</Button>
            </div>
            <div class="mt-auto flex flex-col p-4">
                <div class="flex flex-row gap-2 rounded-md border-2 border-gray-500 px-2 py-1">
                    <div class="my-auto">
                        {#if $userData.badges.first()}
                            {#if $channelUserData.badges.first()}
                                <img on:drag|preventDefault src={getBadgeUrl($channelUserData.badges.first()?.name, 1)} alt="badge" />
                            {:else}
                                <img on:drag|preventDefault src={getBadgeUrl($userData.badges.first()?.name, 1)} alt="badge" />
                            {/if}
                        {/if}
                    </div>
                    <input type="text" class="bg-transparent outline-none" placeholder="Send meessage" />
                </div>
            </div>
        </section>
    {/if}
{/if}
