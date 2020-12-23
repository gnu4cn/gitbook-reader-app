import { Component, 
    OnInit } from '@angular/core';

import { 
    MatDialog, 
} from '@angular/material/dialog';

import {
    MatSnackBar,
    MatSnackBarRef,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import { Book } from '../models';
import { CrudService } from '../services/crud.service';
import { BookService } from './services/book.service';
import { MessageService } from '../services/message.service';

import { SnackbarComponent } from './components/snackbar.component';
import { NewBookDialog } from './components/new-book-dialog.component';

import { 
    IProgressMessage,
    IAddBookDialogResData,
    IFilter,
    IMessage,
    TAvatarIds, 
    filterFn,
    TBookSortBy,
} from '../vendor';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    verticalPosition: MatSnackBarVerticalPosition = 'bottom';

    downloadingList: Array<number> = [];

    sortBy: TBookSortBy = 'openCount';
    displayRecycled: boolean = false;
    beenOpened: boolean = true;
    private bookList: Array<Book>;

    constructor(
        private crud: CrudService,
        private snackbar: MatSnackBar,
        private dialog: MatDialog,
        private msgSevice: MessageService,
        private book: BookService,
    ) {
        this.bookList = this.book.list;
    }

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

    get currentlyReading () {
        const filter: IFilter = {
            displayRecycled: false,
            beenOpened: true,
        }
        return this.bookList.filter(b => filterFn(b, filter)).length;
    }

    get onShelf () {
        const filter = {
            displayRecycled: false,
            beenOpened: false,
        }
        return this.bookList.filter(b => filterFn(b, filter)).length;
    }

    get recycled () {
        const filter = {
            displayRecycled: true,
        }
        return this.bookList.filter(b => filterFn(b, filter)).length;
    }

    ngOnInit() {
        this.msgSevice.getMessage().subscribe((msg: IMessage) => {
            if(msg.event === 'book-list-updated'){
                this.bookList = msg.data as Array<Book>;
            }
        });

        this.crud.ipcRenderer.on('error-occured', (ev, book: Book) => {
            this.book.listUpdated(book);
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
        });

        this.crud.ipcRenderer.on('book-downloaded', (ev, msg: IProgressMessage) => {
            let index: number;
            index = this.downloadingList.findIndex(id => id === msg.book.id);

            this.downloadingList.splice(index, 1);

            this.book.listUpdated(msg.book);

            if(this.downloadingList.length === 0){
                this.snackbar.dismiss();
            }
        });
    }

    displayBookListCurrentlyReading = () => {
        this.displayRecycled = false;
        this.beenOpened = true;

        this.sortBy = 'openCount';

        this.changeFabButton('currently-reading');
    }

    displayBookListOnShelf = () => {
        this.displayRecycled = false;
        this.beenOpened = false;

        this.sortBy = 'dateCreated';

        this.changeFabButton('on-shelf');
    }

    displayBookListRecycled = () => {
        this.displayRecycled = true;

        this.sortBy = 'dateUpdated';

        this.changeFabButton('recycled');
    }

    openAddBookDialog = () => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
        });

        dialogRef.afterClosed().subscribe((res: IAddBookDialogResData) => {
            if(res) this.book.save(res);
        });
    }
}
