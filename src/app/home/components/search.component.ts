import { Component, OnInit, Input } from '@angular/core';

import { 
    ICloudBook,
    IAddBookDialogResData,
} from '../../vendor';

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
}
