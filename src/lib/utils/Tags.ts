import type { Badges } from './Badges';
import type { Emotes } from './Emotes';
import { Tag } from './Tag';

export type TagData = {
    badges: Badges;
    'badge-info': Badges;
    emotes: Emotes;
    'emote-sets': string[];
    color: `#${string}`;
    mod: boolean;
    subscriber: boolean;
    'emote-only': boolean;
    slow: boolean;
    'subs-only': boolean;
    'display-name': string;
    'user-id': string;
    vip: boolean;
    id: string;
    'first-msg': boolean;
    'returning-chatter': boolean;
    'room-id': string;
    'target-msg-id': string;
};

type TagValues = TagData[keyof TagData];

export class Tags {
    private tags: Tag[];

    constructor(raw: string) {
        this.tags = raw.split(';').map((splited) => {
            const [name, value] = splited.split('=');
            return new Tag(name, value.length == 0 ? null : value);
        });
    }

    has(name: keyof TagData) {
        for (const tag of this.tags) {
            if (tag.name === name) {
                return true;
            }
        }

        return false;
    }

    get<T extends keyof TagData>(name: T): TagData[T] | null {
        for (const tag of this.tags) {
            if (tag.name === name) {
                return tag.value as TagData[T];
            }
        }

        return null;
    }

    getThrow<T extends keyof TagData>(name: T): TagData[T] {
        for (const tag of this.tags) {
            if (tag.name === name) {
                return tag.value as TagData[T];
            }
        }

        throw new Error(`Tag ${name} not found`);
    }

    *each() {
        for (const tag of this.tags) {
            yield tag;
        }
    }

    *names() {
        for (const tag of this.tags) {
            yield tag.name;
        }
    }

    *values() {
        for (const tag of this.tags) {
            yield tag.value as TagValues;
        }
    }

    *entries() {
        for (const tag of this.tags) {
            yield [tag.name, tag.value] as const;
        }
    }
}
