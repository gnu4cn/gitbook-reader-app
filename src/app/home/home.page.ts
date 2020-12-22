import { Component, 
    ChangeDetectorRef,
    OnInit } from '@angular/core';
import {
    MatSnackBar,
    MatSnackBarRef,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import { 
    MatDialog, 
} from '@angular/material/dialog';

import { SnackbarComponent } from './components/snackbar.component';
import { Book, Category, Writer, Website } from '../models';
import { MessageService } from '../services/message.service';
import { NewBookDialog } from './components/new-book-dialog.component';
import { CrudService } from '../services/crud.service';

import { 
    IQuery,
    REGEXP_SITE, 
    REGEXP_LOC,
    NewBookDialogData,
    NewBookDialogResData,
    IQueryResult,
    IFilterItem,
    IFilter,
    IProgressMessage,
    IFilterAction,
    IFind,
    IMessage
} from '../vendor';

type TAvatarIds = "currently-reading" | "on-shelf" | "recycled";
@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    verticalPosition: MatSnackBarVerticalPosition = 'bottom';

    bookList: Array<Book> = [];

    writerList: Array<Writer> = [];
    cateList: Array<Category> = [];
    websiteList: Array<Website> = [];
    messageList: Array<string|object> = [];
    downloadingList: Array<number> = [];

    private _filter: IFilter = {
        displayRecycled: false,
        isOpened: false,
        filterList: []
    };

    get filter () {
        return this._filter;
    }

    get bookListDisplay () {
        return this.bookList.filter(b => this.filterFn(b));
    }

    constructor(
        private crud: CrudService,
        private snackbar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private msgService: MessageService,
        private dialog: MatDialog,
    ) {}

    private changeFabButton = (button: TAvatarIds) => {
        const buttonList = ['currently-reading', 'on-shelf', 'recycled'];
        document.getElementById(`avatar-${button}`)
            .style.backgroundColor = '#3880ff';

        const index = buttonList.findIndex(b => b === button);
        buttonList.splice(index, 1);

        buttonList.map(b => {
            document.getElementById(`avatar-${b}`)
                .style.backgroundColor = "#fff";
        });
    } 

    ngOnInit() {
        this.initData();

        this.displayCurrentlyReadingBookList();

        this.crud.ipcRenderer.on('error-occured', (ev, book: Book) => {
            const index = this.bookList.findIndex(b => b.id === book.id);
            this.bookList.splice(index, 1);
            this.bookList.push(book);
        });

        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IProgressMessage) => {
            // 当前没有下载任务
            if(this.downloadingList.length === 0){
                this.snackbar.openFromComponent(SnackbarComponent, {
                    duration: 0,
                    data: msg,
                    horizontalPosition: this.horizontalPosition,
                    verticalPosition: this.verticalPosition,
                });
            }

            const index = this.downloadingList.findIndex(id => id === msg.book.id);
            if(index < 0){
                this.downloadingList.push(msg.book.id);
            }
            this.cdr.detectChanges();
        });

        this.crud.ipcRenderer.on('book-downloaded', (ev, msg: IProgressMessage) => {
            let index: number;
            index = this.downloadingList.findIndex(id => id === msg.book.id);

            this.downloadingList.splice(index, 1);

            index = this.bookList.findIndex(b => b.id === msg.book.id);
            this.bookList.splice(index, 1);
            this.bookList.push(msg.book);

            if(this.downloadingList.length === 0){
                this.snackbar.dismiss();
            }
            this.displayBookListOnShelf();
            this.cdr.detectChanges();
        });

        this.msgService.getMessage().subscribe((msg: IMessage) => {
            const data = msg.data as IQueryResult;
            const book = data.data as Book;
            const cateList = data._data ? data._data as Array<Category> : [];

            const index = this.bookList.findIndex(b => b.id === book.id);
            this.bookList.splice(index, 1);

            if(msg.event === 'book-recycled' || msg.event === 'book-recovered' || msg.event === 'book-updated') this.bookList.push(book);
            if(cateList.length > 0) this.cateList = cateList.slice();

            this.messageList = [...this.messageList, ...data.message];
            this.cdr.detectChanges();
        });
    }

    get bookListCurrentlyReading () {
        this.filter.displayRecycled = false;
        this.filter.isOpened = true;
        return this.bookList.filter(b => this.filterFn(b)).slice();
    }

    get bookListOnShelf () {
        this.filter.displayRecycled = false;
        this.filter.isOpened = false;

        return this.bookList.filter(b => this.filterFn(b)).slice();
    }

    get bookListRecycled () {
        this.filter.displayRecycled = true;

        return this.bookList.filter(b => this.filterFn(b)).slice();
    }

    displayCurrentlyReadingBookList = () => {
        this.filter.displayRecycled = false;
        this.filter.isOpened = false;

        this.changeFabButton('currently-reading');
    }

    displayBookListOnShelf = () => {
        this.filter.displayRecycled = false;
        this.filter.isOpened = false;

        this.changeFabButton('on-shelf');
    }

    displayRecycledBookList = () => {
        this.filter.displayRecycled = true;

        this.changeFabButton('recycled');
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

    // 尚待优化
    filterFn = (book: Book): boolean => {
        // 当只显示 回收站 里的书时
        if(this.filter.displayRecycled) return book.recycled;

        // 当显示正在看的书时 
        if(this.filter.isOpened){ return book.openCount > 0;}
        else {
            // 显示书架上的书
            return !book.recycled && book.openCount === 0;
        }

        let _writer: boolean = false;
        let _website: boolean = false;
        let _cate: boolean = false;
        let _openCount: boolean = false;
        this.filter.filterList.forEach(filterItem => {
            const key = Object.keys(filterItem)[0];

            switch(key){
                case 'writer':
                    if(book.writer.id === filterItem[key].id) {
                        _writer = true;
                    }
                    break
                case 'website':
                    if(book.website.id === filterItem[key].id) {
                        _website = true;
                    }
                    break
                case 'cate':
                    const index = book.cateList.findIndex(cate => cate.id === filterItem[key].id);
                    if(index >= 0) {
                        _cate = true;
                    }
                    break
            }
        });

        return _writer || _website || _cate;
    }

    initData () {
        this.crud.getItems({table: 'Book'})
            .subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];
                const books = res.data as Book[];
                this.bookList = books.slice();
            });

        this.crud.getItems({table: 'Writer'})
            .subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];
                const writers = res.data as Writer[];
                this.writerList = writers.slice();
            });

        this.crud.getItems({table: 'Category'})
            .subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];
                const cates = res.data as Category[];
                this.cateList = cates.slice();
            });

        this.crud.getItems({table: 'Website'})
            .subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];
                const websites = res.data as Website[];
                this.websiteList = websites.slice();
            });
    }

    openAddBookDialog = () => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
            data: { cateList: this.cateList, bookList: this.bookList}
        });

        dialogRef.afterClosed().subscribe((res: NewBookDialogResData) => {
            if(res) {
                this.saveBook(res);
                this.displayBookListOnShelf();
            }
        });
    }
}
