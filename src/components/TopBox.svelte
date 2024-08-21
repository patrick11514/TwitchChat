<script lang="ts">
    import { SwalAlert } from '$/lib/functions';
    import type { WS } from '$/lib/WebSocket';

    import Button from './Button.svelte';
    import { Config, CurrentChannel } from './Store.svelte';

    export let wss: WS[];

    $: wss[0]?.on('message', (tags, source, command, params) => {
        //USER LEAVE CHANNEL EVENT
        if (command.isType('PART')) {
            if (!source) {
                return;
            }

            //if username is same as me, then I sucessfully left channel
            if (source.username === $Config.username) {
                CurrentChannel.set(null);
                return;
            }

            return;
        }
    });

    const leaveChannel = () => {
        if (!$CurrentChannel) {
            SwalAlert({
                icon: 'error',
                title: 'You are not connected to any channel'
            });
            return;
        }

        if (wss.some((ws) => !ws.ready)) {
            SwalAlert({
                icon: 'error',
                title: 'Websocket is not ready'
            });
            return;
        }

        wss.forEach((ws) => ws.leaveRoom($CurrentChannel));
    };
</script>

<div class="flex w-full flex-row items-center justify-between gap-2 border-b-2 border-b-gray-500 p-2">
    <h2 class="text-center font-poppins text-xl font-bold">Connected to <span>{$CurrentChannel}</span></h2>
    <Button on:click={leaveChannel}>Leave channel</Button>
</div>
