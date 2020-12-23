import { Injectable } from '@angular/core';

import { TOpMessage } from '../vendors';

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
