<script lang="ts" context="module">
    import type { Badges } from '$/lib/utils/Badges';
    import { writable } from 'svelte/store';
    import { z } from 'zod';

    export const globalBadgeVersionSchema = z.array(
        z.object({
            id: z.string(),
            image_url_1x: z.string(),
            image_url_2x: z.string(),
            image_url_4x: z.string(),
            title: z.string(),
            description: z.string()
        })
    );

    export const GlobalBadges = writable<Record<string, z.infer<typeof globalBadgeVersionSchema>>>();

    export const UserData = writable<{
        id: string;
        displayName: string;
        badges: Badges;
    }>();

    export const ChannelUserData = writable<{
        badges: Badges;
        badgeInfo: Badges;
        mod: boolean;
        subscriber: boolean;
    }>();

    export const CurrentChannel = writable<string | null>(null);

    export const Config = writable<{
        username: string;
        display_name: string;
        token: string;
    }>();
</script>
