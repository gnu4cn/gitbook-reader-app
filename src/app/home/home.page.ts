import { Component, 
    OnInit } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

import { CrudService } from '../services/crud.service';
import { IProgressMessage } from '../vendor';
import { SnackbarComponent } from './components/snackbar.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    downloadingQueue: Array<IProgressMessage> = [];
    snackBarList: any[] = [];
    constructor(
        private crud: CrudService,
        private snackbar: MatSnackBar
    ) {}

    ngOnInit() {
        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IProgressMessage) => {
            const index = this.downloadingQueue.findIndex(b => b.book.id === msg.book.id);

            if(index >=0) this.downloadingQueue.splice(index, 1);
            if(index < 0){
                const _snackbar = this.snackbar.openFromComponent(SnackbarComponent, {
                    duration: 0,
                    data: msg
                });

                const snackBarItem = {
                    id: msg.book.id,
                    snackbar: _snackbar
                }

                this.snackBarList.push(snackBarItem);
            }
            this.downloadingQueue.push(msg);
        });

        this.crud.ipcRenderer.on('book-downloaded', (ev, msg: IProgressMessage) => {
            const index = this.downloadingQueue.findIndex(b => b.book.id === msg.book.id);

            if(index >=0) this.downloadingQueue.splice(index, 1);
        });
    }
}
