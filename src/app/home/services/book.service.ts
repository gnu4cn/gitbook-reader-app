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
    private _filter: IFilter = {
        displayRecycled: false,
        isOpened: false,
        filterList: []
    };

    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
        private website: WebsiteService,
        private writer: WriterService,
        private cate: CateService
    ) {
    }

    getList = async () => {
        let list: Array<Book>;

        await this.crud.getItems({table: 'Book'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const books = res.data as Book[];
                list = books.slice();
            });

        return list;
    }

    getFilterdList = async (filter: IFilter) => {
        const list = await this.getList();
        return list.filter(b => filterFn(b, filter));
    }

    save = async (res: IAddBookDialogResData) => {
        const newBook = new Book();
        newBook.cateList = [];

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
            this.opMessage.newMsg(queryRes.message);
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
            });

            return 0;
        } 

        if(res.recycled){
            res.book.recycled = true;
            res.book.openCount = 0;

        } else {
            res.book.recycled = false;
        }

        query = {
            table: 'Book',
            item: res.book
        }

        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            this.opMessage.newMsg(queryRes.message);
        });
    }
}
