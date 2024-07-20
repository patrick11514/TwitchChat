<script lang="ts">
    import { PUBLIC_CLIENT_ID, PUBLIC_REDIRECT_URI } from '$env/static/public';
    import Button from './Button.svelte';
    import Title from './Title.svelte';

    const login = () => {
        const searchParams = new URLSearchParams();
        searchParams.append('response_type', 'token');
        searchParams.append('client_id', PUBLIC_CLIENT_ID);
        searchParams.append('redirect_uri', PUBLIC_REDIRECT_URI);

        window.location.assign(`https://id.twitch.tv/oauth2/authorize?${searchParams.toString()}&scope=${['chat:read', 'chat:edit'].map(encodeURIComponent).join('+')}`);
    };
</script>

<div class="bg-secondary m-auto flex flex-col gap-2 rounded-md p-2">
    <Title>Login</Title>
    <Button on:click={login}>Click to login</Button>
</div>
