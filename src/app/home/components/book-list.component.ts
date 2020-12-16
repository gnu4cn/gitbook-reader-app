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
    IItem,
    REGEXP_SITE, 
    REGEXP_LOC,
    NewBookDialogData,
    NewBookDialogResData,
    DeleteBookDialogData,
    DeleteBookDialogResData
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

    constructor(private dialog: MatDialog,
        private crud: CrudService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.initData();
        this.bookListDisplay = this.bookList.slice();

        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg) => {
            const index = this.bookList.findIndex(b => b.id === msg._book.id);
            this.bookList.splice(index, 1);

            this.bookList.push(msg._book);
            this.bookListDisplay = this.bookList.slice();
            this.cdr.detectChanges();
        });

        this.crud.ipcRenderer.on('git-clone-error', (ev, msg) => {
            const index = this.bookList.findIndex(b => b.id === msg._book.id);
            this.bookList.splice(index, 1);
            this.bookList.push(msg._book);
            this.bookListDisplay = this.bookList.slice();
            this.cdr.detectChanges();
        });
    }

    sortBy(list: Array<any>, prop: string){
        return list.sort((a, b) => a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1);
    }

    initData () {
        this.crud.getItems({table: 'Book'}).subscribe(res => {this.bookList = res.slice() as Book[];});
        this.crud.getItems({table: 'Writer'}).subscribe(res => {this.writerList = res.slice() as Writer[];});
        this.crud.getItems({table: 'Category'}).subscribe(res => {this.cateList = res.slice() as Category[];});
        this.crud.getItems({table: 'Website'}).subscribe(res => {this.websiteList = res.slice() as Website[];});
    }

    startDownload = (book: Book) => {
        this.crud.ipcRenderer.send('download-book', book);

        const index = this.bookList.findIndex(b => b.id === book.id);
        this.bookList.splice(index, 1);
        book.downloaded = 1;
        this.bookList.push(book);
        this.bookListDisplay = this.bookList.slice();
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
        const dialogRef = this.dialog.open(DeleteBookDialog, {
            width: '480px',
            data: { _book: book}
        });

        dialogRef.afterClosed().subscribe(res => {
            if(res) this.deleteBook(res);
        });
    }                        

    openAddBookDialog = () => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
            data: { cateList: this.cateList, bookList: this.bookList}
        });

        dialogRef.afterClosed().subscribe(res => {
            if(res) this.saveBook(res);
        });
    }

    deleteBook = (res: DeleteBookDialogResData) => {
        const index = this.bookList.findIndex(b => b.id === res.book.id);
        this.bookList.splice(index, 1);

        if(res.recycled){
            res.book.recycled = true;

            const query: IItem = {
                table: 'Book',
                item: res.book
            }
            this.crud.updateItem(query).subscribe(b => {
                this.bookList.push(b as Book);
            });
        }
        else {

        }
        this.bookListDisplay = this.bookList.slice();
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

            const query: IItem = {
                table: "Website",
                item: _website
            }
            this.crud.addItem(query).subscribe(w => {
                const website = w as Website;
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

                const query: IItem = {
                    table: 'Writer',
                    item: writer,
                }
                this.crud.updateItem(query).subscribe(w => {
                    newBook.writer = w as Writer;
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

            const query: IItem = {
                table: "Writer",
                item: _writer
            }
            this.crud.addItem(query).subscribe(w => {
                const writer = w as Writer;
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

                    const query: IItem = {
                        table: "Category",
                        item: _cate
                    }
                    this.crud.addItem(query).subscribe(c => {
                        const cate = c as Category;
                        this.cateList.push(cate);
                        newBook.cateList.push(cate);
                    });
                }
            });
        }

        // newBook 准备完毕，存入数据库
        const query: IItem = {
            table: 'Book',
            item: newBook
        }
        this.crud.addItem(query).subscribe(b => {
            this.bookList.push(b as Book);
            this.bookListDisplay = this.bookList.slice();
        });
    }
}

