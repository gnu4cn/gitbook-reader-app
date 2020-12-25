import { 
    Component, 
    OnInit, 
    Inject, 
    ElementRef, 
} from '@angular/core';

import { 
    MatDialogRef, 
    MAT_DIALOG_DATA 
} from '@angular/material/dialog';

import { Book } from '../../models';
@Component({
    selector: 'reading-record-dialog',
    styleUrls: ['./reading-record.dialog.scss'],
    templateUrl: 'reading-record.dialog.html',
})
export class ReadingRecordDialog implements OnInit{
    alternate: boolean = true;
    toggle: boolean = true;
    color: boolean = false;
    size: number = 40;
    expandEnabled: boolean = true;
    contentAnimation: boolean = true;
    dotAnimation: boolean = true;
    side = 'left';

    constructor(
        public dialogRef: MatDialogRef<ReadingRecordDialog>,
        @Inject(MAT_DIALOG_DATA) public data: Book
    ) {
    }

    ngOnInit() {}

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
        console.log(`Expand status of entry #${index} changed to ${expanded}`)
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
