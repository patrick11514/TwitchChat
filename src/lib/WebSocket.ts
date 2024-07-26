import { EventEmitter } from './EventEmitter';
import { Command } from './utils/Command';
import { Source } from './utils/Source';
import { Tags } from './utils/Tags';

type Event = {
    open: () => void;
    close: () => void;
    auth: () => void;
    message: (tags: Tags | null, source: Source | null, command: Command<any>, params: string | null) => void;
};

type ResponseCommand = {
    PONG: undefined;
    JOIN: string;
    PART: string;
};

export class WS extends EventEmitter<Event> {
    private websocket!: WebSocket;
    connected = false;

    private username: string;
    private token: string;
    currentChannel: string | null = null;

    constructor(username: string, token: string) {
        super();

        this.username = username;
        this.token = token;

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

    send<$Command extends keyof ResponseCommand>(command: $Command, params: ResponseCommand[$Command]) {
        let str = `${command}`;

        if (typeof params === 'string') {
            str += ` ${params}`;
        }
        // TODO: If params is an array
        //else if (typeof params === 'object') {
        //    if (Array.isArray(params)) {
        //        str += ` ${params.join(' ')}`;Command
        //    }
        //}

        this.websocket.send(str);
    }

    close() {
        this.websocket.close();
    }
}
