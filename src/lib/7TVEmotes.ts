import type { PartType } from '$/components/Message.svelte';
import { z } from 'zod';
import { customFetch, indexOfAll, insertEmotes } from './functions';

const UserDataSchema = z.object({
    id: z.string(),
    platform: z.string(),
    username: z.string(),
    display_name: z.string(),
    emote_set: z.object({
        id: z.string(),
        name: z.string(),
        emotes: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                data: z.object({
                    host: z.object({
                        url: z.string(),
                        files: z.array(
                            z.object({
                                name: z.string(),
                                width: z.number(),
                                height: z.number(),
                                format: z.literal('AVIF').or(z.literal('WEBP'))
                            })
                        )
                    })
                })
            })
        )
    })
});

export class SevenTV {
    private constructor(public uid: string) {}
    private supported = false;
    private userData!: z.infer<typeof UserDataSchema>;
    //cache emote name to index in array
    cache: Record<string, number> = {};

    private async connect() {
        const response = await customFetch(
            `https://7tv.io/v3/users/twitch/${this.uid}`,
            {
                method: 'GET'
            },
            UserDataSchema
        );

        if (response === null || response instanceof z.ZodError) {
            return;
        }

        this.userData = response;

        //create cache
        for (const [id, emote] of Object.entries(this.userData.emote_set.emotes)) {
            this.cache[emote.name] = parseInt(id);
        }

        this.supported = true;
    }

    static async create(uid: string) {
        const instance = new SevenTV(uid);
        await instance.connect();
        return instance;
    }

    fillEmotes(parts: PartType[]): PartType[] {
        if (!this.supported) {
            return parts;
        }

        const newParts: PartType[] = [];
        const emotes = Object.keys(this.cache);

        for (const part of parts) {
            if (part.type !== 'message') {
                newParts.push(part);
                continue;
            }

            const emotesIndexes: {
                start: number;
                emote: string;
                url: string;
            }[] = [];

            for (const emote of emotes) {
                const indexes = indexOfAll(part.content, emote);

                if (indexes.length == 0) {
                    continue;
                }

                const data = this.userData.emote_set.emotes[this.cache[emote]].data;
                const base = data.host.url;
                const rest = data.host.files.find((emote) => emote.format === 'WEBP');

                //let messageRest = part.content;

                for (const index of indexes) {
                    //check if on end, or leading space is presented
                    const afterIndex = index + emote.length;

                    if (afterIndex < part.content.length && part.content[afterIndex] !== ' ') {
                        continue;
                    }

                    //check before
                    const beforeIndex = index - 1;

                    if (beforeIndex > -1 && part.content[beforeIndex] !== ' ') {
                        continue;
                    }

                    emotesIndexes.push({
                        start: index,
                        emote,
                        url: base + '/' + rest?.name
                    });
                }
            }

            newParts.push(...insertEmotes(part.content, emotesIndexes));
        }

        if (newParts.length === 0) {
            return parts;
        }

        return newParts;
    }
}
