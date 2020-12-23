import { Injectable } from '@angular/core';

import { TOpMessage } from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class OpMessageService {
    private _messageList: TOpMessage = [];

    constructor() {}

    newMsg = (msg: TOpMessage) => {
        this._messageList = [...this._messageList, ...msg];
    }
}
