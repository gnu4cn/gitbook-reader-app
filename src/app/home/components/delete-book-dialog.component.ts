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
    DeleteBookDialogData,
    DeleteBookDialogResData,
} from '../../vendor';
import { Book } from '../../models';

@Component({
    selector: 'app-new-book-dialog',
    templateUrl: 'delete-book-dialog.component.html',
})
export class DeleteBookDialog implements OnInit{
    constructor(
        public dialogRef: MatDialogRef<DeleteBookDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DeleteBookDialogData 
    ) {}

    recycled: DeleteBookDialogResData = {
        recycled: true,
        book: this.data._book
    }

    notRecycled: DeleteBookDialogResData = {
        recycled: false,
        book: this.data._book
    }

    ngOnInit() {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
