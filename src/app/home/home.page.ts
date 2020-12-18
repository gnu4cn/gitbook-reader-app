import { Component, 
    ChangeDetectorRef,
    OnInit } from '@angular/core';
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import { CrudService } from '../services/crud.service';
import { IProgressMessage } from '../vendor';
import { SnackbarComponent } from './components/snackbar.component';
interface ISnackBarItem {
    id: number;
    snackbar: any
}
@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    snackBarList: Array<ISnackBarItem> = [];

    horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    verticalPosition: MatSnackBarVerticalPosition = 'bottom';
    constructor(
        private crud: CrudService,
        private cdr: ChangeDetectorRef,
        private snackbar: MatSnackBar
    ) {}

    ngOnInit() {
        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IProgressMessage) => {
            const index = this.snackBarList.findIndex(snackbarItem => snackbarItem.id === msg.book.id);
            if(index < 0){
                const _snackbar = this.snackbar.openFromComponent(SnackbarComponent, {
                    duration: 0,
                    data: msg,
                    horizontalPosition: this.horizontalPosition,
                    verticalPosition: this.verticalPosition,
                });

                const snackBarItem = {
                    id: msg.book.id,
                    snackbar: _snackbar
                }

                this.snackBarList.push(snackBarItem);
                this.cdr.detectChanges();
            }
        });

        this.crud.ipcRenderer.on('book-downloaded', (ev, msg: IProgressMessage) => {
            const index = this.snackBarList.findIndex(snackbarItem => snackbarItem.id === msg.book.id);

            this.snackBarList[index].snackbar.dismiss();
            this.snackBarList.splice(index, 1);
            this.cdr.detectChanges();
        });
    }
}
