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

import { join } from 'path';

import { I18nService } from '../../i18n/i18n.service';
import { Book } from '../../models';

@Component({
    selector: 'readme-dialog',
    templateUrl: 'readme.dialog.html',
    styleUrls: ['./readme.dialog.scss'],
})
export class ReadmeDialog implements OnInit{
    constructor(
        private dialogRef: MatDialogRef<ReadmeDialog>,
        private i18n: I18nService,
        @Inject(MAT_DIALOG_DATA) public data: Book
    ) {}

    get readmeUrl () {
        if(/github/.test(this.data.website.uri)) {
            return this.data.downloaded 
                ? join(this.data.website.uri, this.data.writer.name, this.data.name, 'README.md') 
                : join('https://raw.githubusercontent.com', this.data.writer.name, this.data.name, this.data.defaultBranch, 'README.md');
        }

        if(/gitee/.test(this.data.website.uri)) {
            return this.data.downloaded
                ? join(this.data.website.uri, this.data.writer.name, this.data.name, 'README.md')
                : join('https://gitee.com', this.data.writer.name, this.data.name, 'raw', this.data.defaultBranch, 'README.md');
        }

        if(/gitlab/.test(this.data.website.uri)) {
            return this.data.downloaded
                ? join(this.data.website.uri, this.data.writer.name, this.data.name, 'README.md')
                : join('https://gitlab.com', this.data.writer.name, this.data.name, '-', 'raw', this.data.defaultBranch, 'README.md');
        }

        return join(this.data.website.uri, this.data.writer.name, this.data.name, 'README.md');
    }

    ngOnInit() {}
}
