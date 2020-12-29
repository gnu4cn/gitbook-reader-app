import { Injectable } from '@angular/core';

import { TOpMessage, IMessage } from '../../vendor';
import { MessageService } from '../../services/message.service';

@Injectable({
    providedIn: 'root'
})
export class OpMessageService {
    private _messageList: TOpMessage = [];

    get opMsgList () {
        return this._messageList;
    }

    constructor(
        private message: MessageService
    ) {}

    newMsg = (msg: TOpMessage) => {
        this._messageList = [...this._messageList, ...msg];

        const _msg: IMessage = {
            event: 'new-op-message',
            data: this.opMsgList
        };
        this.message.sendMessage(_msg);
    }
}
