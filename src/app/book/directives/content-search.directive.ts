import { Directive, ElementRef, Output, EventEmitter } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import {
    debounceTime,
    map,
    distinctUntilChanged,
    filter
} from "rxjs/operators";


import { SearchService } from '../services/search.service';


@Directive({
    selector: '[searchOutput]'
})
export class ContentSearchDirective {
    @Output() searchOutput = new EventEmitter<Array<object>>(); 

    constructor(
        private elRef: ElementRef,
        private searchService: SearchService
    ) {
        const events = [
            'change',
            'keydown.enter',
        ];
        const el = elRef.nativeElement;

        this.searchService.init();

        const changeEvent = fromEvent(el, 'change');
        const enterEvent = fromEvent(el, 'keydown.enter');

        const allEvents = merge(changeEvent, enterEvent);

        allEvents.pipe(
            // get value
            map((event: any) => {
                return event.target.value;
            })
            , filter(res => res.length > 1)
            , debounceTime(500)
            , distinctUntilChanged()
        ).subscribe((text: string) => {
            searchService.search(text).then(res => {
                this.searchOutput.emit(res);
            });
        });
    }
}
