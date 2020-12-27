import { 
    Component, 
    OnInit, 
    Inject, 
    ChangeDetectorRef,
    ElementRef, 
} from '@angular/core';

import { 
    MatDialogRef, 
    MAT_DIALOG_DATA 
} from '@angular/material/dialog';

import {
    differenceInYears,
    differenceInMonths,
    differenceInWeeks,
    differenceInDays,
    differenceInHours,
    differenceInMinutes
} from 'date-fns';

import { Book, Record } from '../../models';
import { CrudService } from '../../services/crud.service';
import { MessageService } from '../../services/message.service';
import { 
    IBookWithPath, 
    sortBy, 
    IMessage 
} from '../../vendor';

@Component({
    selector: 'reading-record-dialog',
    styleUrls: ['./reading-record.dialog.scss'],
    templateUrl: 'reading-record.dialog.html',
})
export class ReadingRecordDialog implements OnInit{
    alternate: boolean = true;
    toggle: boolean = true;
    color: boolean = false;
    size: number = 30;
    expandEnabled: boolean = true;
    contentAnimation: boolean = true;
    dotAnimation: boolean = true;
    side = 'left';

    private _recordList: Array<Record>;

    constructor(
        private dialogRef: MatDialogRef<ReadingRecordDialog>,
        private crud: CrudService,
        private cdr: ChangeDetectorRef,
        private message: MessageService,
        @Inject(MAT_DIALOG_DATA) public data: Book
    ) {
        this._recordList = data.recordList.slice();
    }

    get recordList () {
        return sortBy(this._recordList, 'dateCreated');
    } 

    ngOnInit() {
        this.message.getMessage().subscribe((msg: IMessage) => {
            if(msg.event === 'book-list-updated'){
                this._recordList = (msg.data as Array<Book>)
                    .find(b => b.id === this.data.id)
                    .recordList.slice();

                this.cdr.detectChanges();
            }
        });
    }

    moveTo = (path: string, sectionAnchor?: string) => {
        const msg: IBookWithPath = {
            book: this.data,
            path: sectionAnchor ? `${path}#${sectionAnchor}` : path
        }
        this.crud.ipcRenderer.send('open-book-with-path', msg);
    }

    getReadableDate = (date: Date): string => {
        const now = new Date();
        const years = differenceInYears(now, date);
        const months = differenceInMonths(now, date);
        const weeks = differenceInWeeks(now, date);
        const days = differenceInDays(now, date);
        const hours = differenceInHours(now, date);
        const minutes = differenceInMinutes(now, date);

        if(years > 0) return `${years} 年前`;
        if(months > 0) return `${months} 个月前`;
        if(weeks > 0) return `${weeks} 周前`;
        if(days > 0) return `${days} 天前`;
        if(hours > 0) return `${hours} 小时前`;
        return `${minutes} 分钟前`;
    }

    onHeaderClick(event) {
        if (!this.expandEnabled) {
            event.stopPropagation();
        }
    }

    onDotClick(event) {
        if (!this.expandEnabled) {
            event.stopPropagation();
        }
    }

    onExpandEntry(expanded, index) {
        if (!this.expandEnabled) {
            event.stopPropagation();
        }
    }
}
