import { Component, OnInit, Input } from '@angular/core';

import { parseISO } from 'date-fns';
import { 
    ICloudBook,
    IAddBookDialogResData,
    getReadableDate,
} from '../../vendor';

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
export class SearchComponent implements OnInit {
    @Input() bookList: Array<ICloudBook>;
    @Input() searching: boolean;

    constructor(
        private dialog: MatDialog,
        private i18n: I18nService,
        private book: BookService
    ) {}

    ngOnInit() {}

    saveCloudBook = (cloudBook: ICloudBook) => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
            data: cloudBook.url
        });

        dialogRef.afterClosed().subscribe((res: IAddBookDialogResData) => {
            if(res) this.book.save(res);
        });

    }

    readableDate = (date: Date) => {
        return getReadableDate(parseISO(date.toString()));
    }
}
