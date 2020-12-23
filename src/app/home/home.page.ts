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

import { SnackbarComponent } from './components/snackbar.component';
import { NewBookDialog } from './components/new-book-dialog.component';

import { 
    IProgressMessage,
    IAddBookDialogResData,
    IFilter,
    TAvatarIds, 
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
    
    constructor(
        private crud: CrudService,
        private snackbar: MatSnackBar,
        private dialog: MatDialog,
        private book: BookService,
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

    get currentlyReadingNumber () {
        const currentlyReadingFilter: IFilter = {
            displayRecycled: false,
            isOpened: true,
        }
        return this.book.getList(currentlyReadingFilter).length
    }

    get onShelfNumber () {
        const onShelfFilter: IFilter = {
            displayRecycled: false,
            isOpened: true,
        }
        return this.book.getList(onShelfFilter).length
    }

    get recycledNumber () {
        const recycledFilter: IFilter = {
            displayRecycled: true,
        }
        return this.book.getList(recycledFilter).length;
    }

    ngOnInit() {
        this.crud.ipcRenderer.on('error-occured', (ev, book: Book) => {
            this.book.bookUpdated(book);
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

            this.book.bookUpdated(msg.book);

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
