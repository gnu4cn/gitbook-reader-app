import { 
    Component, 
    OnInit, 
    OnChanges,
    SimpleChanges,
    Input 
} from '@angular/core';

import { 
    ICloudBook,
    IAddBookDialogResData,
} from '../../vendor';

import { TranslateService } from '@ngx-translate/core';

import { I18nService } from '../../i18n/i18n.service';
import { NewBookDialog } from './new-book-dialog.component';
import { BookService } from '../services/book.service';

import { 
    MatDialog, 
} from '@angular/material/dialog';

@Component({
    selector: 'app-books-cloud-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnChanges {
    @Input() bookList: Array<ICloudBook>;
    @Input() searching: boolean;
    @Input() keywords: string;
    showPrompt: boolean = true;
    showTips: boolean = true;
    showNotFound: boolean = false;
    tips: Array<string> = [];

    constructor(
        private dialog: MatDialog,
        private translate: TranslateService,
        private i18n: I18nService,
        private book: BookService
    ) {
        translate.get('search.tips.items').subscribe(_ => {
            const keys = Object.keys(_).map(k => this.tips.push(_[k]));
        });
    }

    ngOnInit() {
        this.showNotFound = false;
    }

    ngOnChanges (changes: SimpleChanges) {
        this.showPrompt = true;
        this.showNotFound = false;
        this.showTips = true;
        if('searching' in changes) {
            if(this.keywords && this.bookList.length > 0) {
                this.showTips = false;
            }
            if(this.keywords && this.bookList.length === 0) {
                this.showNotFound = true;
            }
            if(this.bookList.length > 0 || this.searching) {
                this.showPrompt = false;
            }
        }
    }

    saveCloudBook = (cloudBook: ICloudBook) => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
            data: cloudBook.url
        });

        dialogRef.afterClosed().subscribe((res: IAddBookDialogResData) => {
            if(res) this.book.save(res);
        });
    }

    onImageError = (event) => {
        event.target.src = "assets/images/avatar.png";
    }
}
