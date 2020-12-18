import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { IMessage } from '../vendor';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private subject = new Subject<any>();

  sendMessage(message: IMessage) {
    this.subject.next(message);
  }

  clearMessage() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
