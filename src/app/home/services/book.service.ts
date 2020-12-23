import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Book, Category, Writer, Website } from '../../models';
import { OpMessageService } from './op-message.service';
import { WriterService } from './writer.service';
import { WebsiteService } from './website.service';
import { CateService } from './cate.service';

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
} from '../../vendor';

import {
    IDeleteBookDialogResData,
} from '../vendor';

@Injectable({
    providedIn: 'root'
})
export class BookService {
    private _list: Array<Book>;

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
                this._list = books.slice();
            });
    }

    get list () {
        return this._list;
    }

    bookUpdated = (book: Book) => {
        const index = this._list.findIndex(b => b.id === book.id);
        this._list.splice(index, 1);
        this._list.push(book);
    }

    bookDeleted = (book: Book) => {
        const index = this._list.findIndex(b => b.id === book.id);
        this._list.splice(index, 1);
    }

    save = async (res: NewBookDialogResData) => {
        const newBook = new Book();
        newBook.cateList = [];

        const newBookUri = res.bookUri;

        const site = newBookUri.match(REGEXP_SITE)[0];
        const [ writerName, name ] = newBookUri.replace(REGEXP_SITE, '').match(REGEXP_LOC)[0].split('/');
        const re = new RegExp(/\.git$/)
        newBook.name = re.test(name) ? name.replace(re, '') : name;

        newBook.website = await this.website.newWebsit(site);
        newBook.writer = await this.writer.newWriter(writerName, newBook.website);

        newBook.cateList = await this.cate.saveList(res.cateList).slice();

        const query: IQuery = {
            table: 'Book',
            item: newBook
        }
        this.crud.addItem(query).subscribe((res: IQueryResult) => {
            this.opMessage.newMsg(res.message);

            this._list.push(res.data as Book);
        });
    }

    open = (book: Book) => {
        this.crud.ipcRenderer.send('open-book', book);
        book.openCount += 1;
        book.recycled = false;

        const query: IQuery = {
            table: 'Book',
            item: book
        }

        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            const msg: IMessage = {
                event: 'book-updated',
                data: queryRes
            };
            this.opMessage.newMsg(queryRes.message);
            this.bookUpdated(queryRes.data as Book);
        });
    }

    update = async (book: Book) => {
        let query: IQuery;

        book.cateList = await this.cate.saveList(book.cateList).slice();

        query = {
            table: 'Book',
            item: book
        }
        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            this.opMessage.newMsg(queryRes.message);

            this.bookUpdated(queryRes.data as Book);
        });
    }

    recycleRecoverDelete =  async (res: IDeleteBookDialogResData) => {
        let query: IQuery;

        if(res.recycled){
            res.book.recycled = true;
            res.book.openCount = 0;

            query = {
                table: 'Book',
                item: res.book
            }

            await this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
                this.opMessage.newMsg(queryRes.message);
                this.bookUpdated(queryRes.data as Book);
            });

            return 0;
        }

        if (!res.recycled && res.remove){
            query = {
                table: 'Book',
                item: res.book
            }

            await this.crud.deleteItem(query).subscribe((queryRes: IQueryResult) => {
                this.opMessage.newMsg(queryRes.message);
                this.bookDeleted(res.book);
            });

            return 0;
        }

        res.book.recycled = false;
        query = {
            table: 'Book',
            item: res.book
        }

        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            this.opMessage.newMsg(queryRes.message);
            this.bookUpdated(queryRes.data as Book);
        });
    }
}
