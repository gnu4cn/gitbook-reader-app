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
import { MessageService } from '../../services/message.service';

import { DeleteBookDialog } from './delete-book-dialog.component';
import { EditBookCateListDialog } from './edit-book-cate-list.component';

import { 
    IQuery,
    IEditBookDialogData,
    IDeleteBookDialogResData,
    IMessage,
    IQueryResult,
} from '../../vendor';

@Component({
    selector: 'app-book-list',
    templateUrl: './book-list.component.html',
    styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
    @Input() bookListDisplay: Array<Book>;
    @Input() cateList: Array<Category>;

    _cateList: Array<Category>;

    constructor(
        private crud: CrudService,
        private msgService: MessageService,
        private dialog: MatDialog,
    ) {}

    ngOnInit() {
        this._cateList = this.cateList.slice();
    }

    selectable: boolean = true;
    removable: boolean = true;

    sortBy = (list: Array<any>, prop: string) => {
        return list.sort((a, b) => a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1);
    }

    startDownload = (book: Book) => {
        this.crud.ipcRenderer.send('download-book', book);
        document
            .getElementById(`download-book-${book.id}`)
            .setAttribute('disabled', 'true');
    }

    openBook(book: Book) {
        this.crud.ipcRenderer.send('open-book', book)
    }

    listBooksUnderCate = (cate: Category) => {
        console.log(cate)
    }

    openEditBookCateListDialog = (book: Book) => {
        const dataDialog: IEditBookDialogData = {
            cateList: this.cateList,
            book: book
        }

        const dialogRef = this.dialog.open(EditBookCateListDialog, {
            width: '480px',
            data: dataDialog
        });

        dialogRef.afterClosed().subscribe((res: Book) => {
            if(res) this.updateBook(res);
        });
    }

    updateBook = async (book: Book) => {
        let query: IQuery;
        let msg: IMessage;
        let index: number;
        let messageList: Array<string|object> = [];

        await book.cateList.map((_c: Category) => {
            index = this.cateList.findIndex(c => c.name === _c.name);

            if(index<0){
                const cate = new Category();
                cate.name = _c.name;
                index = book.cateList.findIndex(c => c.name === _c.name);
                book.cateList.splice(index, 1)

                query = {
                    table: 'Category',
                    item: cate
                }

                this.crud.addItem(query).subscribe((queryRes: IQueryResult) => {
                    messageList = [...messageList, ...queryRes.message];
                    this._cateList.push(queryRes.data as Category);
                    book.cateList.push(queryRes.data as Category);
                });
            }
        });

        query = {
            table: 'Book',
            item: book
        }
        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            messageList = [...messageList, ...queryRes.message];

            msg = {
                event: 'book-updated',
                data: {
                    message: messageList,
                    data: book,
                    _data: this._cateList
                }
            }

            this.msgService.sendMessage(msg);
        });
    }

    openDeleteBookDialog = (book: Book) => {
        const dialogRef = this.dialog.open(DeleteBookDialog, {
            width: '480px',
            data: book
        });

        dialogRef.afterClosed().subscribe((res: IDeleteBookDialogResData) => {
            if(res) this.deleteBook(res);
        });
    }                        

    deleteBook = async (res: IDeleteBookDialogResData) => {
        let query: IQuery;
        let msg: IMessage;

        if(res.recycled){
            res.book.recycled = true;

            query = {
                table: 'Book',
                item: res.book
            }

            await this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
                msg = {
                    event: 'book-recycled',
                    data: {
                        message: queryRes.message,
                        data: queryRes.data
                    }
                }
                this.msgService.sendMessage(msg);
            });

            return 0;
        }

        if (!res.recycled && res.remove){
            query = {
                table: 'Book',
                item: res.book
            }

            await this.crud.deleteItem(query).subscribe((queryRes: IQueryResult) => {
                msg = {
                    event: 'book-deleted',
                    data: {
                        message: queryRes.message,
                        data: res.book
                    }
                }

                this.msgService.sendMessage(msg);
            });

            return 0;
        }

        res.book.recycled = false;
        query = {
            table: 'Book',
            item: res.book
        }

        this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
            msg = {
                event: 'book-recovered',
                data: {
                    message: queryRes.message,
                    data: queryRes.data
                }
            }
            this.msgService.sendMessage(msg);
        });
    }
}
