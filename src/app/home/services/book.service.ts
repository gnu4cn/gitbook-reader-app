import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Book, Category, Writer, Website } from '../../models';
import { OpMessageService } from './op-message.service';
import { WriterService } from './writer.service';
import { WebsiteService } from './website.service';
import { CateService } from './cate.service';

import { 
    IFilter,
    filterFn,
    IQuery,
    IQueryResult,
    REGEXP_SITE, 
    REGEXP_LOC,
    IAddBookDialogResData,
    IDeleteBookDialogResData,
} from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class BookService {
    list: Array<Book>;

    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
        private website: WebsiteService,
        private writer: WriterService,
        private cate: CateService
    ) {
        this.crud.getItems({table: 'Book'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const books = res.data as Book[];
                this.list = books.slice();
            });
    }

    // `deleted` 是可选参数，没有时是 `undefined`, `!undefined`为真，传入`true`时`!true`为假
    listUpdated = (book: Book, deleted?: boolean) => {
        const index = this.list.findIndex(b => b.id === book.id);
        this.list.splice(index, 1);
        if(!deleted) this.list.push(book);
    }

    getBookFromId = (bookId: number) => {
        return this.list.find(b => b.id === bookId);
    }

    save = async (res: IAddBookDialogResData) => {
        const newBook = new Book();

        const newBookUri = res.bookUri;

        const site = newBookUri.match(REGEXP_SITE)[0];
        const [ writerName, name ] = newBookUri.replace(REGEXP_SITE, '').match(REGEXP_LOC)[0].split('/');

        const re = new RegExp(/\.git$/)
        newBook.name = re.test(name) ? name.replace(re, '') : name;

        newBook.website = await this.website.newWebsit(site);
        newBook.writer = await this.writer.newWriter(writerName, newBook.website);
        newBook.cateList = await this.cate.saveList(res.cateList);

        const query: IQuery = {
            table: 'Book',
            item: newBook
        }

        this.crud.addItem(query).subscribe((res: IQueryResult) => {
            this.opMessage.newMsg(res.message);
            this.list.push(res.data as Book);
        });
    }

    open = (book: Book) => {
        this.crud.ipcRenderer.send('open-book', book);
        book.recycled = false;

        const query: IQuery = {
            table: 'Book',
            item: book
        }

        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            this.opMessage.newMsg(queryRes.message);
            this.listUpdated(queryRes.data as Book);
        });
    }

    update = async (book: Book) => {
        let query: IQuery;

        book.cateList = await this.cate.saveList(book.cateList);

        query = {
            table: 'Book',
            item: book
        }
        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            this.opMessage.newMsg(queryRes.message);
            this.listUpdated(queryRes.data as Book);
        });
    }

    recycleRecoverDelete =  async (res: IDeleteBookDialogResData) => {
        let query: IQuery;

        if (!res.recycled && res.remove){
            query = {
                table: 'Book',
                item: res.book
            }

            await this.crud.deleteItem(query).subscribe((queryRes: IQueryResult) => {
                this.opMessage.newMsg(queryRes.message);
                this.listUpdated(res.book, true);
            });

            return 0;
        } 

        if(res.recycled){
            res.book.recycled = true;

        } else {
            res.book.recycled = false;
        }

        query = {
            table: 'Book',
            item: res.book
        }

        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            this.opMessage.newMsg(queryRes.message);
            this.listUpdated(queryRes.data as Book);
        });
    }
}
