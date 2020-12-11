import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { map, share, catchError } from 'rxjs/operators';
import normalize from 'normalize-path';
import { resolve } from 'url';

import { join } from '../shared/utils';
import { SettingsService } from './settings.service';

import * as path from 'path';

export interface CachePage {
    resolvedPath: string;
    notFound: boolean;
    contents: string;
}

@Injectable({
    providedIn: 'root'
})
export class FetchService {
    private inFlight = new Map<string, Observable<CachePage>>();

    get path404() {
        return join(this.settings.sharedPath, this.settings.notFoundPage);
    }

    get sharedPath() {
        return this.settings.sharedPath;
    }

    constructor(
        private http: HttpClient,
        private settings: SettingsService
    ) {
    }

    /**
     * Finds a file returning a prmomise of the url
     * Returns null if the file is not found
     * TODO: handle directory vs file.
     * example: `/path/to/file` can be `/path/to/file.md` or `/path/to/file/README.md`
     *
     * @param dir
     * @param filename
     */
    async find(dir: string, filename: string): Promise<string> {
        const url = filename ? resolve(dir, filename) : null;
        const item = await this.get(url).toPromise();
        if (!item) {
            throw new Error('Possible cache error');
        }
        return item.notFound || !url ? null : item.resolvedPath;
    }

    /**
     *
     * @param url {string} Full path relative to root
     */
    get(url: string): Observable<CachePage> {
        if (!url) {
            return of({
                resolvedPath: url,
                contents: '',
                notFound: false
            });
        }

        if (this.inFlight.has(url)) {
            return this.inFlight.get(url);
        }

        let notFound = url === this.path404;
        const obs: Observable<CachePage> = this.http
        .get(url, {responseType: 'text'})
        .pipe(
            catchError(() => {
                notFound = true;
                return this.http.get(this.path404, { responseType: 'text' });
            }),
            map((contents: string) => {
                this.inFlight.delete(url);
                return {
                    contents,
                    notFound,
                    resolvedPath: url
                };
            }),
            share()
        );

        this.inFlight.set(url, obs);
        return obs;
    }
}
