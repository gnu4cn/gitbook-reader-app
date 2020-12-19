import { Component, OnInit, Inject,
    ChangeDetectorRef
} from '@angular/core';
import {MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';

import { IProgressMessage } from '../../vendor';
import { CrudService } from '../../services/crud.service';
@Component({
    selector: 'app-snackbar',
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent implements OnInit {
    constructor(
        private crud: CrudService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_SNACK_BAR_DATA) public data: IProgressMessage
    ) { }

    ngOnInit() {
        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IProgressMessage) => {
            if(msg.book.id === this.data.book.id){
                this.data.progress = msg.progress;
                //this.cdr.detectChanges();
            }
        });
    }
}
