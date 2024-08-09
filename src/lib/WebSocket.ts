import { EventEmitter } from './EventEmitter';
import { Command } from './utils/Command';
import { Source } from './utils/Source';
import { Tag } from './utils/Tag';
import { Tags } from './utils/Tags';

type Event = {
    open: () => void;
    close: () => void;
    auth: () => void;
    message: (tags: Tags | null, source: Source | null, command: Command<any>, params: string | null) => void;
};

type ResponseCommand = {
    PONG: string;
    JOIN: string;
    PART: string;
    PRIVMSG: [string, string];
};

export class WS extends EventEmitter<Event> {
    private websocket!: WebSocket;
    connected = false;

    currentChannel: string | null = null;
    ready = false;

    constructor(
        private username: string,
        private token: string
    ) {
        super();

        this.connect();
    }

    private connect() {
        this.websocket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        this.registerEvents();
    }

    private registerEvents() {
        this.websocket.onopen = () => {
            this.connected = true;
            super.emit('open');
            this.auth();
        };

        this.websocket.onclose = () => {
            this.connected = false;
            super.emit('close');
        };

        this.websocket.onerror = () => {
            super.emit('close');
            this.connected = false;
            this.connect();
        };

        this.websocket.onmessage = (ev) => {
            const { data } = ev;
            if (typeof data !== 'string') {
                return;
            }

            this.parseMessage(data);
        };
    }

    private parseRow(row: string) {
        let tags: Tags | null = null;

        if (row.startsWith('@')) {
            const split = row.indexOf(' ');
            tags = new Tags(row.slice(1, split));
            row = row.slice(split + 1);
        }

        let source: Source | null = null;

        if (row[0] === ':') {
            const split = row.indexOf(' ');
            source = new Source(row.slice(1, split));

            row = row.slice(split + 1);
        }

        const commandEnd = row.indexOf(':');
        let command: Command<any>;
        let params: string | null = null;
        if (commandEnd == -1) {
            command = Command.create(row.trim());
        } else {
            command = Command.create(row.slice(0, commandEnd).trim());
            params = row.slice(commandEnd + 1);
        }

        if (command.isType('AUTHENTIFICATED')) {
            this.ready = true;

            //TODO: REMOVE
            this.joinRoom('patrikmint');

            super.emit('auth');
        }

        super.emit('message', tags, source, command, params);
    }

    private parseMessage(message: string) {
        const rows = message.split('\r\n').filter((msg) => msg.length > 0);
        rows.map((item) => this.parseRow(item));
    }

    private auth() {
        this.websocket.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
        this.websocket.send(`PASS oauth:${this.token}`);
        this.websocket.send(`NICK ${this.username}`);
    }

    joinRoom(roomName: string) {
        this.currentChannel = roomName;
        this.send('JOIN', `#${roomName}`);
    }

    leaveRoom(roomName: string) {
        this.currentChannel = roomName;
        this.send('PART', `#${roomName}`);
    }

    send<$Command extends keyof ResponseCommand>(command: $Command, params: ResponseCommand[$Command], tags?: Tags) {
        let str = `${command}`;

        if (tags) {
            if (tags.size() > 0) {
                str =
                    '@' +
                    Array.from(tags.each())
                        .map((tag) => `${tag.name}=${tag.value}`)
                        .join(';') +
                    ' ' +
                    str;
            }
        }

        if (typeof params === 'string') {
            str += ` ${params}`;
        } else if (typeof params === 'object') {
            if (Array.isArray(params)) {
                str += ` ${params.join(' ')}`;
                Command;
            }
        }

        this.websocket.send(str);
    }

    sendMessage(channel: string, message: string) {
        this.send('PRIVMSG', [`#${channel}`, `:${message}`]);
    }

    reply(channel: string, message: string, originalMessageId: string) {
        this.send('PRIVMSG', [`#${channel}`, `:${message}`], Tags.fromArray([new Tag('reply-parent-msg-id', originalMessageId)]));
    }

    close() {
        this.websocket.close();
    }
}
