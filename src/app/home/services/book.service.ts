import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Book, Category, Writer, Website } from '../../models';
import { OpMessageService } from './op-message.service';
import { WriterService } from './writer.service';
import { WebsiteService } from './website.service';
import { CateService } from './cate.service';
import { MessageService } from '../../services/message.service';
import { FetchService } from './fetch.service';

import { 
    IFilter,
    filterFn,
    IQuery,
    IQueryResult,
    IMessage,
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
        private message: MessageService,
        private writer: WriterService,
        private fetchService: FetchService,
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
        if(index >= 0) this.list.splice(index, 1);
        if(!deleted) this.list.push(book);

        const msg: IMessage = {
            event: 'book-list-updated',
            data: this.list
        }

        this.message.sendMessage(msg);
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
        newBook.isFromMainstreamPlatform = /github/.test(site) || /gitee/.test(site) || /gitlab/.test(site);

        newBook.website = await this.website.newWebsit(site);

        let rawRepo: object;
        if(/gitee/.test(site)){
            rawRepo = await this.fetchService.getRepoProfile(site, newBook.name, writerName);

            newBook.writer = await this.writer.newWriter(writerName, newBook, rawRepo['owner']['login']); 
        }
        else {
            newBook.writer = await this.writer.newWriter(writerName, newBook);
        }

        newBook.cateList = await this.cate.saveList(res.cateList);
        newBook.recordList = [];

        // 这里要获取到 Repository 的更多信息
        if(/gitlab/.test(site)) {
            const rawRepoList = await this.fetchService.getRepoProfile(site, newBook.name, writerName, newBook.writer.platformId);

            rawRepo = (rawRepoList as object[]).find(repo => repo['path'] === newBook.name);

            newBook.desc = rawRepo['description'];
            newBook.defaultBranch = rawRepo['default_branch'];
        }

        if(newBook.isFromMainstreamPlatform && !(/gitlab/.test(site))){
            rawRepo = rawRepo ? rawRepo : await this.fetchService.getRepoProfile(site, newBook.name, writerName);
            newBook.desc = rawRepo['description'];
            newBook.defaultBranch = rawRepo['default_branch'];
        }

        const query: IQuery = {
            table: 'Book',
            item: newBook
        }

        this.crud.addItem(query)
            .subscribe(res => {
                this.opMessage.newMsg(res.message);
                this.listUpdated(res.data as Book);
            });
    }

    open = async (book: Book) => {
        this.crud.ipcRenderer.send('open-book', book);
        book.recycled = false;

        const query: IQuery = {
            table: 'Book',
            item: book
        }

        this.crud.updateItem(query).subscribe(res => {
            this.opMessage.newMsg(res.message);
            this.listUpdated(res.data as Book);
        });
    }

    update = async (book: Book) => {
        book.cateList = await this.cate.saveList(book.cateList);

        const query: IQuery = {
            table: 'Book',
            item: book
        }
        this.crud.updateItem(query).subscribe(queryRes => {
            this.opMessage.newMsg(queryRes.message);
            this.listUpdated(queryRes.data as Book);
        });
    }

    recycleRecoverDelete =  async (res: IDeleteBookDialogResData) => {
        let query: IQuery;

        if(res.recycled || res.remove) {
            query = {
                table: 'Record',
                item: res.book
            }

            this.crud.deleteItem(query).subscribe(queryRes => {
                this.opMessage.newMsg(queryRes.message);
            });
        }

        if (!res.recycled && res.remove){
            query = {
                table: 'Book',
                item: res.book
            }

            this.crud.deleteItem(query).subscribe(queryRes => {
                this.opMessage.newMsg(queryRes.message);
                this.listUpdated(res.book, true);
            });

            return;
        } 

        if(res.recycled) { res.book.recycled = true; } 
        else { res.book.recycled = false; }
        delete res.book.recordList;

        query = {
            table: 'Book',
            item: res.book
        }

        this.crud.updateItem(query).subscribe(queryRes => {
            this.opMessage.newMsg(queryRes.message);
            this.listUpdated(queryRes.data as Book);
        });
    }
}
