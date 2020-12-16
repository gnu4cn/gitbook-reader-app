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

import { 
    IDeleteBookDialogData,
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
        @Inject(MAT_DIALOG_DATA) public data: IDeleteBookDialogData 
    ) {}

    recycled: IDeleteBookDialogResData = {
        recycled: true,
        book: this.data.book
    }

    notRecycled: IDeleteBookDialogResData = {
        recycled: false,
        book: this.data.book
    }

    ngOnInit() {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
