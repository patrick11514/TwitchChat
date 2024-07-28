import { Badge } from './Badge';

export class Badges {
    private badges: Badge[];

    constructor(raw: string) {
        this.badges = raw.split(',').map((text) => {
            const [name, id] = text.split('/');
            const badge = new Badge();
            badge.id = id;
            badge.name = name;
            return badge;
        });
    }

    length() {
        return this.badges.length;
    }

    has(name: string) {
        for (const badge of this.badges) {
            if (badge.name === name) {
                return true;
            }
        }

        return false;
    }

    get(nameOrId: string): Badge | null {
        for (const badge of this.badges) {
            if (badge.name === nameOrId || badge.id === nameOrId) {
                return badge;
            }
        }

        return null;
    }

    *each() {
        for (const badge of this.badges) {
            yield badge;
        }
    }

    first(): Badge | null {
        return this.badges[0] || null;
    }

    last(): Badge | null {
        return this.badges[this.badges.length - 1] || null;
    }
}
