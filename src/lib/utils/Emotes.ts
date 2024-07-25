import { Emote } from './Emote';

export class Emotes {
    private emotes: Emote[];

    constructor(raw: string) {
        this.emotes = raw.split('/').map((text) => {
            const [name, textInfo] = text.split(':');
            const [start, end] = textInfo.split('-');

            const emote = new Emote();
            emote.name = name;
            emote.textStart = parseInt(start);
            emote.textEnd = parseInt(end);

            return emote;
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
}
