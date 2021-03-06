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

import { I18nService } from '../../i18n/i18n.service';

import { 
    IDeleteBookDialogResData,
} from '../../vendor';

import { Book } from '../../models';

@Component({
    selector: 'app-new-book-dialog',
    templateUrl: 'delete-book-dialog.component.html',
})
export class DeleteBookDialog implements OnInit{
    constructor(
        public dialogRef: MatDialogRef<DeleteBookDialog>,
        private i18n: I18nService,
        @Inject(MAT_DIALOG_DATA) public data: Book
    ) {}

    recycled: IDeleteBookDialogResData = {
        recycled: true,
        remove: false,
        book: this.data
    }

    deleteRecycled: IDeleteBookDialogResData = {
        recycled: false,
        remove: true,
        book: this.data
    }

    recoverRecycled: IDeleteBookDialogResData = {
        recycled: false,
        remove: false,
        book: this.data
    }

    ngOnInit() {}
}
