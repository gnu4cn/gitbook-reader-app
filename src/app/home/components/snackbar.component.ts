import { Component, OnInit, Inject,
    ChangeDetectorRef
} from '@angular/core';

import {
    MAT_SNACK_BAR_DATA, 
    MatSnackBar
} from '@angular/material/snack-bar';

import { IProgressMessage, sortBy } from '../../vendor';
import { CrudService } from '../../services/crud.service';
@Component({
    selector: 'app-snackbar',
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent implements OnInit {
    private downloadingList: Array<IProgressMessage> = [];

    get downloadingQueue () {
        return sortBy(this.downloadingList, 'progress');
    }

    constructor(
        private crud: CrudService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_SNACK_BAR_DATA) public data: IProgressMessage
    ) {
        this.downloadingList.push(data);
    }

    ngOnInit() {
        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IProgressMessage) => {
            const index: number = this.downloadingList.findIndex(item => item.book.id === msg.book.id);

            if(index >= 0) this.downloadingList.splice(index, 1);
            this.downloadingList.push(msg);

            this.cdr.detectChanges();
        });

        this.crud.ipcRenderer.on('book-downloaded', (ev, msg: IProgressMessage) => {
            const index: number = this.downloadingList.findIndex(item => item.book.id === msg.book.id);

            this.downloadingList.splice(index, 1);
            this.downloadingList.push(msg);

            this.cdr.detectChanges();
        });
    }
}
