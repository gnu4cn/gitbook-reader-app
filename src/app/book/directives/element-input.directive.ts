import { Directive, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { MessageService } from '../../services/message.service';

@Directive({
    selector: '[elementInput]'
})
export class ElementInputDirective {
    private subscription: Subscription;

    constructor(
        private el: ElementRef,
        private message: MessageService
    ) {
        this.subscription = this.message.getMessage().subscribe(msg => {
            if(msg.event === 'print-content-updated'){
                const html = msg.data.changingThisBreaksApplicationSecurity;
                el.nativeElement.contentDocument.body.innerHTML = html;
            }
        })
    }

}
