<script lang="ts" context="module">
    import { SevenTV } from '$/lib/7TVEmotes';
    import type { Badges } from '$/lib/utils/Badges';
    import type { Source } from '$/lib/utils/Source';
    import type { Tags } from '$/lib/utils/Tags';
    import { writable } from 'svelte/store';
    import { z } from 'zod';

    export const BadgeSchema = z.array(
        z.object({
            id: z.string(),
            image_url_1x: z.string(),
            image_url_2x: z.string(),
            image_url_4x: z.string(),
            title: z.string(),
            description: z.string()
        })
    );

    type BadgeData = Record<
        string,
        Record<
            string,
            {
                image_url_1x: string;
                image_url_2x: string;
                image_url_4x: string;
                title: string;
                description: string;
            }
        >
    >;

    export const GlobalBadges = writable<BadgeData>();

    export const GlobalEmotes = writable<
        Record<
            string,
            {
                name: string;
                urls: {
                    url_1x: string;
                    url_2x: string;
                    url_4x: string;
                };
            }
        >
    >();
    export const ChannelBadges = writable<BadgeData>({});

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

    export const RawChannelTags = writable<Tags>();
    export const CurrentChannel = writable<string | null>(null);
    export const RoomId = writable<string>();

    export const Config = writable<{
        username: string;
        display_name: string;
        token: string;
    }>();

    export const OnlinePeople = writable<Source[]>([]);
    export const AllPeople = writable<Source[]>([]);
    export const PeopleSettings = writable<
        Record<
            string,
            {
                color: string;
                displayName: string;
            }
        >
    >({});

    export const SevenTVData = writable<SevenTV>();

    export const replyingMessage = writable<string | null>(null);

    export const logged = writable(false);
    export const SettingsOpened = writable(false);
</script>
