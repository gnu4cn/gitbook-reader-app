import { 
    Component, 
    OnInit, 
    OnChanges,
    SimpleChanges,
    Input
} from '@angular/core';

import { Router } from '@angular/router';
import { 
    MatDialog, 
} from '@angular/material/dialog';

import { I18nService } from '../../i18n/i18n.service';
import { CrudService } from '../../services/crud.service';
import { Book, Category } from '../../models';
import { BookService } from '../services/book.service';
import { CateService } from '../services/cate.service';
import { OpMessageService } from '../services/op-message.service';

import { DeleteBookDialog } from './delete-book-dialog.component';
import { EditBookCateListDialog } from './edit-book-cate-list.component';
import { ReadingRecordDialog } from './reading-record-dialog.component';

import { 
    sortBy,
    IFilter,
    IDeleteBookDialogResData,
    IFilterAction,
    IFilterItem,
    TBookSortBy,
    filterFn,
} from '../../vendor';

@Component({
    selector: 'app-book-list',
    templateUrl: './book-list.component.html',
    styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit, OnChanges {
    @Input() sortBy: string = 'recordList:length';
    @Input() displayRecycled: boolean = false;
    @Input() beenOpened: boolean = true;
    @Input() _bookList: Array<Book>;

    filter: IFilter = {
        displayRecycled: this.displayRecycled,
        beenOpened: this.beenOpened,
        filterList: []
    };

    constructor(
        private crud: CrudService,
        private dialog: MatDialog,
        private book: BookService,
        private i18n: I18nService,
        private opMessage: OpMessageService
    ) {}

    get bookList () {
        const bookList = this._bookList.filter(b => filterFn(b, this.filter));
        return /\:/.test(this.sortBy) 
            ? sortBy(bookList, this.sortBy.split(':')[0], this.sortBy.split(':')[1])
            : sortBy(bookList, this.sortBy);
    }

    ngOnInit() {}

    ngOnChanges (changes: SimpleChanges) {
        if ('sortBy' in changes) {
            if(changes.displayRecycled) this.filter.displayRecycled = changes.displayRecycled.currentValue;
            if(changes.beenOpened) this.filter.beenOpened = changes.beenOpened.currentValue;
        }

    }

    changeFilter = (filterAction: IFilterAction) => {
        let index: number;
        switch (filterAction.action){
            case 'add':
                index = this.filter.filterList.findIndex((filterItem: IFilterItem) => {
                    const key = Object.keys(filterItem)[0];
                    const _key = Object.keys(filterAction.filterItem)[0];
                    return key === _key && filterItem[key].id === filterAction[key].id;
                });

                if(index < 0)this.filter.filterList.push(filterAction.filterItem);
                break;
            case 'remove':
                index = this.filter.filterList.findIndex((filterItem: IFilterItem) => {
                    const key = Object.keys(filterItem)[0];
                    const _key = Object.keys(filterAction.filterItem)[0];
                    return key === _key && filterItem[key].id === filterAction[key].id;
                });

                if(index >= 0)this.filter.filterList.splice(index, 1);
                break;
        }
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

    openReadingRecordDialog = (bookId: number) => {
        const dialogRef = this.dialog.open(ReadingRecordDialog, {
            width: '640px',
            data: bookId
        });
    }

    listBooksUnderCate = (cate: Category) => {
        console.log(cate)
    }

    openBook = (book: Book) => {
        this.book.open(book);
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

    onImageError = (event) => {
        event.target.src = "assets/images/avatar.png";
    }
}
