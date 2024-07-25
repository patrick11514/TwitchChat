export class Source {
    username: string | null;
    host: string;

    constructor(raw: string) {
        const parts = raw.split('!');

        if (parts.length > 1) {
            this.username = parts[0];
            this.host = parts[1];
        } else {
            this.username = null;
            this.host = parts[0];
        }
    }
}
