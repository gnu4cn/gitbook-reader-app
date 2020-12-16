import { Injectable } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Tables, IFind, IQuery, IQueryResult } from '../vendor';

@Injectable({
    providedIn: 'root'
})
export class CrudService {
    get ipcRenderer () {
        return this.electronService.ipcRenderer;
    }

    constructor(private electronService: ElectronService) { }

    getItems(findParam: IFind): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('get-items', findParam)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    addItem(item: IQuery): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('add-item', item)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    updateItem(item: IQuery): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('update-item', item)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    deleteItem(item: IQuery): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('delete-item', item)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }
}
