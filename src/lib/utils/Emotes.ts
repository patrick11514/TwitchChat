import { Emote } from './Emote';

export class Emotes {
    private emotes: Emote[];

    constructor(raw: string) {
        if (raw.length === 0) {
            this.emotes = [];
            return;
        }

        this.emotes = raw.split('/').flatMap((text) => {
            const [name, textInfo] = text.split(':');
            const sections = textInfo.split(',').map((section) => section.split('-'));

            const emotes = [];

            for (const [start, end] of sections) {
                const emote = new Emote();
                emote.name = name;
                emote.textStart = parseInt(start);
                emote.textEnd = parseInt(end);
                emotes.push(emote);
            }

            return emotes;
        });
    }

    has(name: string) {
        for (const emote of this.emotes) {
            if (emote.name === name) {
                return true;
            }
        }

        return false;
    }

    get(name: string): Emote | null {
        for (const emote of this.emotes) {
            if (emote.name === name) {
                return emote;
            }
        }

        return null;
    }

    *each() {
        for (const emote of this.emotes) {
            yield emote;
        }
    }

    *eachSorted() {
        for (const emote of this.emotes.toSorted((a, b) => a.textStart - b.textStart)) {
            yield emote;
        }
    }
}
