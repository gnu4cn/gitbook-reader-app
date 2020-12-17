import { 
    Component, 
    OnInit, 
    ChangeDetectorRef,
} from '@angular/core';

import { Router } from '@angular/router';

import { 
    MatDialog, 
} from '@angular/material/dialog';

import { Book, Category, Writer, Website } from '../../models';
import { CrudService } from '../../services/crud.service';

import { NewBookDialog } from './new-book-dialog.component';
import { DeleteBookDialog } from './delete-book-dialog.component';
import { 
    IQuery,
    REGEXP_SITE, 
    REGEXP_LOC,
    NewBookDialogData,
    NewBookDialogResData,
    IDeleteBookDialogData,
    IDeleteBookDialogResData,
    IBookDownloading,
    IQueryResult,
    IFilterItem,
    IFilterAction
} from '../../vendor';

@Component({
    selector: 'app-book-list',
    templateUrl: './book-list.component.html',
    styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
    // full bookList
    bookList: Array<Book> = [];
    // bookList to display
    bookListDisplay: Array<Book> = [];
    writerList: Array<Writer> = [];
    cateList: Array<Category> = [];
    websiteList: Array<Website> = [];
    messageList: Array<string|object> = [];
    private filter: Array<IFilterItem> = [];

    get recycledList () {
        return this.bookList.filter(b => b.recycled === true);
    }

    get onShelfList () {
        return this.bookList.filter(b => b.recycled === false);
    }

    constructor(private dialog: MatDialog,
        private crud: CrudService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.initData();
        this.bookListDisplay = this.bookList.filter(b => this.filterFn(b));

        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IBookDownloading) => {
            const index = this.bookList.findIndex(b => b.id === msg.book.id);
            this.bookList.splice(index, 1);

            this.bookList.push(msg.book);
            this.bookListDisplay = this.bookList.filter(b => this.filterFn(b));
            this.cdr.detectChanges();
        });

        this.crud.ipcRenderer.on('git-clone-error', (ev, msg: IBookDownloading) => {
            const index = this.bookList.findIndex(b => b.id === msg.book.id);
            this.bookList.splice(index, 1);
            this.bookList.push(msg.book);
            this.bookListDisplay = this.bookList.filter(b => this.filterFn(b));
            this.cdr.detectChanges();
        });
    }

    sortBy = (list: Array<any>, prop: string) => {
        return list.sort((a, b) => a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1);
    }

    changeFilter = (filterAction: IFilterAction) => {
        let index: number;
        switch (filterAction.action){
            case 'add':
                index = this.filter.findIndex((filterItem: IFilterItem) => {
                    const key = Object.keys(filterItem)[0];
                    const _key = Object.keys(filterAction.filterItem)[0];
                    return key === _key && filterItem[key].id === filterAction[key].id;
                });

                if(index < 0)this.filter.push(filterAction.filterItem);
                break;
            case 'remove':
                index = this.filter.findIndex((filterItem: IFilterItem) => {
                    const key = Object.keys(filterItem)[0];
                    const _key = Object.keys(filterAction.filterItem)[0];
                    return key === _key && filterItem[key].id === filterAction[key].id;
                });

                if(index >= 0)this.filter.splice(index, 1);
                break;
        }
    }

    displayRecycledBooks = () => {
        this.bookListDisplay = this.recycledList.slice();
    }

    displayBooksOnShelf = () => {
        this.bookListDisplay = this.onShelfList.slice();
    }

    // 尚待优化
    filterFn = (book: Book): boolean => {
        // 只显示不在回收站的书籍
        if(book.recycled) return false;

        // 没有过滤条件全部显示
        if(this.filter.length === 0)return true;

        // 有过滤条件时, 只要有一个条件满足就显示？还是所有条件都满足时才显示？
        let _writer: boolean = false;
        let _website: boolean = false;
        let _cate: boolean = false;
        this.filter.forEach(filterItem => {
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

    startDownload = (book: Book) => {
        this.crud.ipcRenderer.send('download-book', book);

        const index = this.bookList.findIndex(b => b.id === book.id);
        this.bookList.splice(index, 1);
        book.downloaded = 1;
        this.bookList.push(book);
        this.bookListDisplay = this.bookList.filter(b => this.filterFn(b));
    }

    openBook(book: Book) {
        this.crud.ipcRenderer.send('open-book', book)
    }

    queryCatName = () => {
        console.log('ion-label click test.')
    }

    removeCate = () => {
        console.log('ion-icon click test.')
    }

    openDeleteBookDialog = (book: Book) => {
        const dataDialog: IDeleteBookDialogData = {book: book};

        const dialogRef = this.dialog.open(DeleteBookDialog, {
            width: '480px',
            data: dataDialog
        });

        dialogRef.afterClosed().subscribe((res: IDeleteBookDialogResData) => {
            if(res) this.deleteBook(res);
        });
    }                        

    deleteBook = (res: IDeleteBookDialogResData) => {
        const index = this.bookList.findIndex(b => b.id === res.book.id);
        this.bookList.splice(index, 1);

        let query: IQuery;
        if(res.recycled){
            res.book.recycled = true;

            query = {
                table: 'Book',
                item: res.book
            }
            this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
                this.bookList.push(queryRes.data as Book);
            });
        }
        else {
            query = {
                table: 'Book',
                item: res.book
            }
            this.crud.deleteItem(query).subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];
            });
        }
        this.bookListDisplay = this.bookList.filter(b => this.filterFn(b));
    }

    openAddBookDialog = () => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
            data: { cateList: this.cateList, bookList: this.bookList}
        });

        dialogRef.afterClosed().subscribe((res: NewBookDialogResData) => {
            if(res) this.saveBook(res);
        });
    }

    saveBook = (res: NewBookDialogResData) => {
        const newBook = new Book();
        newBook.cateList = [];

        const newBookUri = res.bookUri;

        const site = newBookUri.match(REGEXP_SITE)[0];
        const [ writerName, name ] = newBookUri.replace(REGEXP_SITE, '').match(REGEXP_LOC)[0].split('/');
        newBook.name = name;

        const website = this.websiteList.find(w => w.uri === site);
        if (website){
            newBook.website = website;
        }
        else {
            const _website = new Website();
            _website.uri = site;

            const query: IQuery = {
                table: "Website",
                item: _website
            }
            this.crud.addItem(query).subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];

                const website = res.data as Website;
                newBook.website = website ;
                this.websiteList.push(website);
            });
        }

        const writer: Writer = this.writerList.find(w => w.name === writerName);
        if (writer){
            // 查看 website 是否在 writer 的
            if(writer.websiteList === undefined) writer.websiteList = [];
            const website = writer.websiteList.find(w => w.uri === newBook.website.uri);
            if(!website) {
                writer.websiteList.push(newBook.website);

                const query: IQuery = {
                    table: 'Writer',
                    item: writer,
                }
                this.crud.updateItem(query).subscribe((res: IQueryResult) => {
                    this.messageList = [...this.messageList, ...res.message];
                    newBook.writer = res.data as Writer;
                });
            }
            else newBook.writer = writer;
        }
        else {
            const _writer = new Writer();
            _writer.name = writerName;

            // 将 newBook.website 写入 _writer.websiteList
            _writer.websiteList = [];
            _writer.websiteList.push(newBook.website);

            const query: IQuery = {
                table: "Writer",
                item: _writer
            }
            this.crud.addItem(query).subscribe((res: IQueryResult) => {
                this.messageList = [...this.messageList, ...res.message];

                const writer = res.data as Writer;
                newBook.writer = writer;
                this.writerList.push(writer);
            });
        }

        // 处理 cateList
        if(res.cateList.length>0){
            res.cateList.map(c => {
                const cate = this.cateList.find(cate => cate.name === c.name);
                if (cate) newBook.cateList.push(cate);
                else {
                    const _cate = new Category();
                    _cate.name = c.name;

                    const query: IQuery = {
                        table: "Category",
                        item: _cate
                    }
                    this.crud.addItem(query).subscribe((res: IQueryResult) => {
                        this.messageList = [...this.messageList, ...res.message];

                        const cate = res.data as Category;
                        this.cateList.push(cate);
                        newBook.cateList.push(cate);
                    });
                }
            });
        }

        // newBook 准备完毕，存入数据库
        const query: IQuery = {
            table: 'Book',
            item: newBook
        }
        this.crud.addItem(query).subscribe((res: IQueryResult) => {
            this.messageList = [...this.messageList, ...res.message];

            this.bookList.push(res.data as Book);
            this.bookListDisplay = this.bookList.filter(b => this.filterFn(b));
        });
    }
}
