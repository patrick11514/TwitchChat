export type CommandType = {
    JOIN: string;
    PART: string;
    NOTICE: string;
    CLEARCHAT: string;
    HOSTTARGET: string;
    PRIVMSG: string;
    PING: undefined;
    CAP: boolean;
    GLOBALUSERSTATE: undefined;
    USERSTATE: string;
    ROOMSTATE: string;
    RECONNECT: undefined;
    UNSUPPORTED: undefined;
    AUTHENTIFICATED: string;
    NUMERIC: undefined;
    UNEXPECTED: undefined;
    CLEARMSG: string;
};

export class Command<$Name extends keyof CommandType> {
    name!: $Name;
    data!: CommandType[$Name];

    constructor(command: $Name, data: CommandType[$Name]) {
        this.name = command;
        this.data = data;
    }

    static create(raw: string) {
        const [name, ...params] = raw.split(' ');

        switch (name) {
            case 'JOIN':
            case 'PART':
            case 'NOTICE':
            case 'CLEARCHAT':
            case 'HOSTTARGET':
            case 'PRIVMSG':
            case 'CLEARMSG':
                let param = params[0];
                return new Command(name as keyof CommandType, name === 'JOIN' || name === 'PART' ? param.substring(1) : param);
            case 'PING':
                return new Command(name, undefined);
            case 'CAP':
                return new Command(name, params[1] === 'ACK');
            case 'GLOBALUSERSTATE':
                return new Command(name, undefined);
            case 'USERSTATE':
            case 'ROOMSTATE':
                return new Command(name, params[0]);
            case 'RECONNECT':
                return new Command(name, undefined);
            case '421':
                return new Command('UNSUPPORTED', undefined);
            case '001':
                return new Command('AUTHENTIFICATED', params[0]);
            case '002': // Ignoring all other numeric messages.
            case '003':
            case '004':
            case '353': // Tells you who else is in the chat room you're joining.
            case '366':
            case '372':
            case '375':
            case '376':
                return new Command('NUMERIC', undefined);
            default:
                return new Command('UNEXPECTED', undefined);
        }
    }

    isType<T extends keyof CommandType>(type: T): this is Command<T> {
        return (this.name as unknown) === type;
    }
}
