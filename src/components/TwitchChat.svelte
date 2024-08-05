<script lang="ts">
    import { SevenTV } from '$/lib/7TVEmotes';
    import { customFetch, SwalAlert } from '$/lib/functions';
    import { WS } from '$/lib/WebSocket';
    import { PUBLIC_CLIENT_ID } from '$env/static/public';
    import { invoke } from '@tauri-apps/api';
    import { onMount } from 'svelte';
    import { Key } from 'ts-key-enum';
    import z from 'zod';
    import BottomBox from './BottomBox.svelte';
    import Button from './Button.svelte';
    import ChatWindow, { DeletedMessages, Messages } from './ChatWindow.svelte';
    import Input from './Input.svelte';
    import {
        AllPeople,
        BadgeSchema,
        ChannelBadges,
        ChannelUserData,
        Config,
        CurrentChannel,
        GlobalBadges,
        GlobalEmotes,
        OnlinePeople,
        PeopleSettings,
        RawChannelTags,
        RoomId,
        SevenTVData,
        UserData
    } from './Store.svelte';
    import Title from './Title.svelte';
    import TopBox from './TopBox.svelte';

    let assetsLoaded = 0;
    const assetsNeededToLoad = 2;

    //global badges
    const getGlobalBadges = async () => {
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
                        versions: BadgeSchema
                    })
                )
            })
        );

        if (badges === null || badges instanceof z.ZodError) {
            return;
        }

        const globalBadges: typeof $GlobalBadges = {};

        for (const badge of badges.data) {
            globalBadges[badge.set_id] = {};

            for (const version of badge.versions) {
                globalBadges[badge.set_id][version.id] = {
                    image_url_1x: version.image_url_1x,
                    image_url_2x: version.image_url_2x,
                    image_url_4x: version.image_url_4x,
                    title: version.title,
                    description: version.description
                };
            }
        }

        GlobalBadges.set(globalBadges);
        assetsLoaded++;
    };

    const getGlobalEmotes = async () => {
        const emotes = await customFetch(
            'https://api.twitch.tv/helix/chat/emotes/global',
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
                        id: z.string(),
                        name: z.string(),
                        images: z.object({
                            url_1x: z.string(),
                            url_2x: z.string(),
                            url_4x: z.string()
                        })
                    })
                )
            })
        );

        if (emotes === null || emotes instanceof z.ZodError) {
            return;
        }

        const globalEmotes: typeof $GlobalEmotes = {};

        for (const emote of emotes.data) {
            globalEmotes[emote.id] = {
                name: emote.name,
                urls: emote.images
            };
        }

        GlobalEmotes.set(globalEmotes);
        assetsLoaded++;
    };

    const getChannelBadges = async () => {
        const badges = await customFetch(
            `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${$RoomId}`,
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
                        versions: BadgeSchema
                    })
                )
            })
        );

        if (badges === null || badges instanceof z.ZodError) {
            return;
        }

        const channelBadges: typeof $ChannelBadges = {};

        for (const badge of badges.data) {
            channelBadges[badge.set_id] = {};

            for (const version of badge.versions) {
                channelBadges[badge.set_id][version.id] = {
                    image_url_1x: version.image_url_1x,
                    image_url_2x: version.image_url_2x,
                    image_url_4x: version.image_url_4x,
                    title: version.title,
                    description: version.description
                };
            }
        }

        ChannelBadges.set(channelBadges);
    };

    const loadSevenTV = async () => {
        SevenTVData.set(await SevenTV.create($RoomId));
    };

    const init = async () => {
        try {
            Config.set(await invoke<typeof $Config>('get_config'));
            await Promise.allSettled([getGlobalBadges(), getGlobalEmotes()]);

            setupWebsocket();
        } catch (_) {
            SwalAlert({
                icon: 'error',
                title: 'Unable to load config, try again'
            });
        }
    };

    onMount(() => {
        init();

        return () => {
            if (MainWebSocket) {
                MainWebSocket.close();
            }

            if (SendingWebSocket) {
                SendingWebSocket.close();
            }
        };
    });

    let MainWebSocket: WS;
    let SendingWebSocket: WS;

    const setupWebsocket = async () => {
        MainWebSocket = new WS($Config.username, $Config.token);

        MainWebSocket.on('message', (tags, source, command, params) => {
            if (command.isType('PING')) {
                MainWebSocket.send('PONG', params ?? '');
            }

            if (command.isType('PRIVMSG')) {
                if (!params || !source || !tags) {
                    return;
                }

                if (source.username && !(source.username in $PeopleSettings)) {
                    $PeopleSettings[source.username] = {
                        color: tags.get('color')!,
                        displayName: tags.get('display-name')!
                    };
                }

                Messages.set([
                    ...$Messages,
                    {
                        type: 'chat',
                        date: new Date(),
                        source: source,
                        tags: tags,
                        content: params
                    }
                ]);

                return;
            }

            //USER JOIN TO CHANNEL EVENT

            if (command.isType('JOIN')) {
                if (!source) {
                    return;
                }

                //if username is same as me, then I sucessfully joined channel
                if (source.username === $Config.username) {
                    //clear messages when join
                    Messages.set([
                        {
                            type: 'join',
                            date: new Date(),
                            source
                        }
                    ]);
                    DeletedMessages.set({});

                    CurrentChannel.set(command.data);
                    return;
                }

                Messages.set([
                    ...$Messages,
                    {
                        type: 'join',
                        date: new Date(),
                        source
                    }
                ]);

                OnlinePeople.set([...$OnlinePeople, source]);
                AllPeople.set([...$AllPeople, source]);

                return;
            }

            if (command.isType('PART')) {
                if (!source) {
                    return;
                }

                Messages.set([
                    ...$Messages,
                    {
                        type: 'leave',
                        date: new Date(),
                        source
                    }
                ]);

                OnlinePeople.set($OnlinePeople.filter((user) => user.username !== source.username));

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

                $PeopleSettings[$Config.username] = {
                    color: tags.get('color')!,
                    displayName: tags.get('display-name')!
                };
                return;
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

                RawChannelTags.set(tags);
                return;
            }

            if (command.isType('ROOMSTATE')) {
                if (!tags || !tags.has('room-id')) {
                    return;
                }

                RoomId.set(tags.get('room-id')!);
                getChannelBadges();
                loadSevenTV();
                return;
            }

            if (command.isType('CLEARMSG')) {
                if (!tags || !tags.has('target-msg-id')) {
                    return;
                }

                DeletedMessages.set({
                    ...$DeletedMessages,
                    [tags.get('target-msg-id')!]: new Date()
                });
                return;
            }
        });

        ///

        SendingWebSocket = new WS($Config.username, $Config.token);

        SendingWebSocket.on('message', (tags, source, command, params) => {
            if (command.isType('PING')) {
                SendingWebSocket.send('PONG', params ?? '');
            }

            //update userstate from response on sent message
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

                RawChannelTags.set(tags);
                return;
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

        if (!MainWebSocket.ready) {
            SwalAlert({
                icon: 'error',
                title: 'Websocket is not ready'
            });
            return;
        }

        //reset online people
        OnlinePeople.set([]);
        //reset all people in that chat which showed
        AllPeople.set([]);
        //reset people settings in old channel
        PeopleSettings.set({});

        //join channels
        MainWebSocket.joinRoom(newChannel);
        SendingWebSocket.joinRoom(newChannel);
        newChannel = '';
    };
</script>

{#if $Config}
    {#if !$UserData}
        <Title class="my-auto">Loading user data...</Title>
    {:else if assetsLoaded !== assetsNeededToLoad}
        <Title class="my-auto">Loading twitch data...</Title>
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
        <section class="flex max-h-screen flex-1 flex-col">
            <TopBox wss={[MainWebSocket, SendingWebSocket]} />
            <ChatWindow />
            <BottomBox ws={SendingWebSocket} />
        </section>
    {/if}
{/if}
