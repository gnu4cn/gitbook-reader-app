import { Component, 
    OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { ElectronService } from 'ngx-electron';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    isElectron: boolean;

    constructor(
        private activateRoute: ActivatedRoute,
        private electronService: ElectronService
    ) {
    }

    ngOnInit() {
        this.electronService.ipcRenderer.send('book-list-loading');
    }
}
