<script lang="ts">
    import { customFetch, SwalAlert } from '$/lib/functions';
    import { WS } from '$/lib/WebSocket';
    import { PUBLIC_CLIENT_ID } from '$env/static/public';
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import { Key } from 'ts-key-enum';
    import z from 'zod';
    import BottomBox from './BottomBox.svelte';
    import Button from './Button.svelte';
    import Input from './Input.svelte';
    import { ChannelUserData, Config, CurrentChannel, GlobalBadges, globalBadgeVersionSchema, UserData } from './Store.svelte';
    import Title from './Title.svelte';
    import TopBox from './TopBox.svelte';

    //global badges
    const init = async () => {
        try {
            Config.set(await invoke<typeof $Config>('get_config'));

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
                    Authorization: `Bearer ${$Config.token}`
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

        const globalBadges: typeof $GlobalBadges = {};

        for (const badge of badges.data) {
            globalBadges[badge.set_id] = badge.versions;
        }

        GlobalBadges.set(globalBadges);
    };

    onMount(() => {
        init();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    });

    let ws: WS;

    const setupWebsocket = async () => {
        ws = new WS($Config.username, $Config.token);

        ws.on('message', (tags, source, command, params) => {
            if (command.isType('PING')) {
                ws.send('PONG', undefined);
            }

            if (command.isType('PRIVMSG')) {
                console.log(source, params);
            }

            //USER JOIN TO CHANNEL EVENT
            if (command.isType('JOIN')) {
                if (!source) {
                    return;
                }

                //if username is same as me, then I sucessfully joined channel
                if (source.username === $Config.username) {
                    CurrentChannel.set(command.data);
                    return;
                }

                return;
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

                UserData.set({
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

                ChannelUserData.set({
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

        if (!ws.ready) {
            SwalAlert({
                icon: 'error',
                title: 'Websocket is not ready'
            });
            return;
        }

        ws.joinRoom(newChannel);
        newChannel = '';
    };
</script>

{#if $Config}
    {#if !$UserData}
        <Title class="my-auto">Loading...</Title>
    {:else if !$CurrentChannel}
        <div class="flex flex-1 flex-col items-center justify-center gap-2">
            <Title>Enter channel name</Title>
            <Input
                on:keypress={(ev) => {
                    if (ev.key === Key.Enter) {
                        joinChannel();
                    }
                }}
                bind:value={newChannel}
            />
            <Button on:click={joinChannel}>Enter</Button>
        </div>
    {:else if $ChannelUserData}
        <section class="flex flex-1 flex-col">
            <TopBox {ws} />
            <BottomBox {ws} />
        </section>
    {/if}
{/if}
