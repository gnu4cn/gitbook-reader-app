import { Injectable } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { IFind, IQuery, IQueryResult } from '../vendor';

@Injectable({
    providedIn: 'root'
})
export class CrudService {
    constructor(private electronService: ElectronService) { }

    get ipcRenderer () {
        return this.electronService.ipcRenderer;
    }

    getItems(query: IFind): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('get-items', query)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    getItem(query: IFind): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('get-item', query)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    addItem(query: IQuery): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('add-item', query)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    updateItem(query: IQuery): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('update-item', query)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    deleteItem(query: IQuery): Observable<IQueryResult> {
        return of(this.ipcRenderer.sendSync('delete-item', query)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }
}
