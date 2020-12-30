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
    selector: 'readme-dialog',
    templateUrl: 'readme.dialog.html',
})
export class ReadmeDialog implements OnInit{
    constructor(
        private dialogRef: MatDialogRef<ReadmeDialog>,
        @Inject(MAT_DIALOG_DATA) public data: Book
    ) {}

    get readmeUrl () {
        const giteeReadmeUrl = "https://gitee.com/hainanwu/18.06-linalg-notes/raw/master/README.md";
        const gitlabReadmeUrl = 'https://gitlab.com/aviman1109/devops/-/raw/master/README.md';
        const githubReadmeUrl = 'https://raw.githubusercontent.com/gnu4cn/ccna60d/main/README.md';

        return '';
    }

    ngOnInit() {}
}
