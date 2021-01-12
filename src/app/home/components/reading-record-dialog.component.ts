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

import { I18nService } from '../../i18n/i18n.service';
import { Book, Record } from '../../models';
import { CrudService } from '../../services/crud.service';
import { MessageService } from '../../services/message.service';
import { 
    IBookWithPath, 
    sortBy, 
    IMessage,
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
        private i18n: I18nService,
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
