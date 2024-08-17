import type { PartType } from '$/components/Message.svelte';
import { PeopleSettings } from '$/components/Store.svelte';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import z from 'zod';
import { Emotes } from './utils/Emotes';

export const SwalAlert = async (data: SweetAlertOptions) => {
    if (!browser) {
        return {
            isConfirmed: false
        };
    }

    return Swal.fire({
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showCancelButton: false,
        showConfirmButton: false,
        ...data
    });
};

export const DEFAULT_ASSETS = {
    TWITCH_DEFAULT_BADGE: 'https://assets.twitch.tv/assets/dark-40f6c299eb07b670b88d.svg'
} as const;

export const customFetch = async <$ReturnType>(url: string, options: RequestInit, schema: z.ZodType<$ReturnType>): Promise<$ReturnType | z.ZodError<$ReturnType> | null> => {
    const response = await fetch(url, options);

    if (!response.ok) {
        return null;
    }
    try {
        const json = await response.json();
        const data = schema.safeParse(json);

        if (!data.success) {
            return data.error;
        }

        return data.data;
    } catch (_) {
        return null;
    }
};

export const insertEmotes = (
    message: string,
    emotes: /* Twitch Emote */
    | Emotes
        | null
        | /* 7TV Emote */ {
              start: number;
              emote: string;
              url: string;
          }[]
) => {
    if (emotes === null) {
        emotes = new Emotes('');
    }

    let currentIndex = 0;
    const emoteParts: PartType[] = [];

    for (const emote of emotes instanceof Emotes ? emotes.eachSorted() : emotes) {
        const cut = message.substring(currentIndex, 'textStart' in emote ? emote.textStart : emote.start);

        if (cut.length > 0) {
            emoteParts.push({
                type: 'message',
                content: cut
            });
        }

        emoteParts.push({
            type: 'emote',
            name: 'name' in emote ? message.substring(emote.textStart, emote.textEnd + 1) : emote.emote,
            //Universal emote url
            url: 'name' in emote ? `https://static-cdn.jtvnw.net/emoticons/v2/${emote.name}/default/light/1.0` : emote.url
        });

        currentIndex = 'textEnd' in emote ? emote.textEnd + 1 : emote.start + emote.emote.length;
    }

    const rest = message.substring(currentIndex, message.length);

    if (rest.length > 0) {
        emoteParts.push({
            type: 'message',
            content: rest
        });
    }

    console.log(emoteParts);

    return emoteParts;
};

export const insertMentions = (
    message: string,
    mentions: {
        start: number;
        name: string;
        text: string;
    }[]
) => {
    let currentIndex = 0;
    const emoteParts: PartType[] = [];

    for (const mention of mentions) {
        const cut = message.substring(currentIndex, mention.start);

        if (cut.length > 0) {
            emoteParts.push({
                type: 'message',
                content: cut
            });
        }

        let color = '#ffffff';
        let displayName = mention.text;

        if (mention.name in get(PeopleSettings)) {
            displayName = displayName.replace(mention.name, get(PeopleSettings)[mention.name].displayName);
            color = get(PeopleSettings)[mention.name].color;
        }

        emoteParts.push({
            type: 'mention',
            color,
            content: displayName
        });

        currentIndex = mention.start + mention.text.length;
    }

    emoteParts.push({
        type: 'message',
        content: message.substring(currentIndex, message.length)
    });

    return emoteParts;
};
