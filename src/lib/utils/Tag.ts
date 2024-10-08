import { Badges } from './Badges';
import { Emotes } from './Emotes';
import type { TagData } from './Tags';

export class Tag {
    name: keyof TagData;
    value: TagData[keyof TagData] | null;

    constructor(name: string, value: string | null) {
        this.name = name as keyof TagData;

        if (value === null) {
            this.value = null;
            return;
        }

        switch (this.name) {
            case 'badges':
            case 'badge-info':
                this.value = new Badges(value);
                break;
            case 'emotes':
                this.value = new Emotes(value);
                break;
            case 'emote-sets':
                this.value = value.split(',');
                break;
            case 'color':
                this.value = value.startsWith('#') ? (value as `#${string}`) : null;
                break;
            case 'mod':
            case 'emote-only':
            case 'slow':
            case 'subs-only':
            case 'subscriber':
            case 'vip':
            case 'first-msg':
            case 'returning-chatter':
                this.value = value === '1' ? true : false;
                break;
            case 'display-name':
            case 'user-id':
            case 'id':
            case 'room-id':
            case 'target-msg-id':
            case 'reply-parent-msg-body':
            case 'reply-parent-display-name':
            case 'reply-parent-msg-id':
                this.value = value;
                break;
            default:
                this.value = null;
                break;
        }
    }
}
