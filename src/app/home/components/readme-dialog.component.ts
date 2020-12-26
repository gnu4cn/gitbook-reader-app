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

@Component({
    selector: 'readme-dialog',
    templateUrl: 'readme.dialog.html',
})
export class ReadmeDialog implements OnInit{
    constructor(
        private dialogRef: MatDialogRef<ReadmeDialog>,
        @Inject(MAT_DIALOG_DATA) public data: string
    ) {}

    ngOnInit() {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
