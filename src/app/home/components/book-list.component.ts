import { 
    Component, 
    OnInit, 
    Input
} from '@angular/core';

import { Router } from '@angular/router';
import { 
    MatDialog, 
} from '@angular/material/dialog';

import { CrudService } from '../../services/crud.service';
import { Book, Category } from '../../models';
import { BookService } from '../services/book.service';
import { CateService } from '../services/cate.service';
import { OpMessageService } from '../services/op-message.service';

import { DeleteBookDialog } from './delete-book-dialog.component';
import { EditBookCateListDialog } from './edit-book-cate-list.component';
import { ReadmeDialog } from './readme-dialog.component';

import { 
    sortBy,
    IFilter,
} from '../../vendor';

import { 
    IDeleteBookDialogResData,
    TBookSortBy,
    filterFn,
} from '../vendor';

@Component({
    selector: 'app-book-list',
    templateUrl: './book-list.component.html',
    styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
    @Input() filter: IFilter;
    @Input() sortBy: TBookSortBy;

    constructor(
        private crud: CrudService,
        private dialog: MatDialog,
        private book: BookService,
        private opMessage: OpMessageService
    ) {}

    ngOnInit() {}
    
    get bookList () {
        return sortBy(this.book.list
            .filter(b => filterFn(b, this.filter)), 
            this.sortBy);
    }

    startDownload = (book: Book) => {
        this.crud.ipcRenderer.send('download-book', book);
        document
            .getElementById(`download-book-${book.id}`)
            .setAttribute('disabled', 'true');
        document
            .getElementById(`delete-book-${book.id}`)
            .setAttribute('disabled', 'true');
    }

    listBooksUnderCate = (cate: Category) => {
        console.log(cate)
    }

    openReadmeDialog = (readme: string) => {
        this.dialog.open(ReadmeDialog, {
            width: '640px',
            data: readme
        });
    }

    openEditBookCateListDialog = (book: Book) => {
        const dialogRef = this.dialog.open(EditBookCateListDialog, {
            width: '480px',
            data: book
        });

        dialogRef.afterClosed().subscribe((res: Book) => {
            if(res) this.book.update(res);
        });
    }

    openDeleteBookDialog = (book: Book) => {
        const dialogRef = this.dialog.open(DeleteBookDialog, {
            width: '480px',
            data: book
        });

        dialogRef.afterClosed().subscribe((res: IDeleteBookDialogResData) => {
            if(res) this.book.recycleRecoverDelete(res);
        });
    }                        
}
