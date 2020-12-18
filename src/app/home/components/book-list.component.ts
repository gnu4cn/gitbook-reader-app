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
import { Book } from '../../models';
import { DeleteBookDialog } from './delete-book-dialog.component';
import { MessageService } from '../../services/message.service';

import { 
    IQuery,
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
    constructor(
        private crud: CrudService,
        private msgService: MessageService,
        private dialog: MatDialog,
    ) {}

    ngOnInit() {}

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

    queryCatName = () => {
        console.log('ion-label click test.')
    }

    removeCate = () => {
        console.log('ion-icon click test.')
    }

    openDeleteBookDialog = (book: Book) => {
        const dataDialog: Book = book;

        const dialogRef = this.dialog.open(DeleteBookDialog, {
            width: '480px',
            data: dataDialog
        });

        dialogRef.afterClosed().subscribe((res: IDeleteBookDialogResData) => {
            if(res) this.deleteBook(res);
        });
    }                        

    deleteBook = (res: IDeleteBookDialogResData) => {
        let query: IQuery;
        let msg: IMessage;
        if(res.recycled){
            res.book.recycled = true;

            query = {
                table: 'Book',
                item: res.book
            }
            this.crud.updateItem(query).subscribe((queryRes: IQueryResult) => {
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
            this.crud.deleteItem(query).subscribe((queryRes: IQueryResult) => {
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
        });

        return 0;
    }
}
