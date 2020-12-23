import { Component, 
    ChangeDetectorRef,
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
    IFilterItem,
    IFilter,
    IProgressMessage,
    IFilterAction,
} from '../vendor';

import { IAddBookDialogResData } from './vendor';

import { TAvatarIds } from './vendor';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    verticalPosition: MatSnackBarVerticalPosition = 'bottom';

    downloadingList: Array<number> = [];

    private _filter: IFilter = {
        displayRecycled: false,
        isOpened: false,
        filterList: []
    };

    get filter () {
        return this._filter;
    }

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

    changeFilter = (filterAction: IFilterAction) => {
        let index: number;
        switch (filterAction.action){
            case 'add':
                index = this.filter.filterList.findIndex((filterItem: IFilterItem) => {
                    const key = Object.keys(filterItem)[0];
                    const _key = Object.keys(filterAction.filterItem)[0];
                    return key === _key && filterItem[key].id === filterAction[key].id;
                });

                if(index < 0)this.filter.filterList.push(filterAction.filterItem);
                break;
            case 'remove':
                index = this.filter.filterList.findIndex((filterItem: IFilterItem) => {
                    const key = Object.keys(filterItem)[0];
                    const _key = Object.keys(filterAction.filterItem)[0];
                    return key === _key && filterItem[key].id === filterAction[key].id;
                });

                if(index >= 0)this.filter.filterList.splice(index, 1);
                break;
        }

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
