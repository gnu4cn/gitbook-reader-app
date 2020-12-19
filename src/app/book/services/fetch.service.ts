import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { map, share, catchError } from 'rxjs/operators';
import normalize from 'normalize-path';
import { join as _join } from 'path';

import { join } from '../shared/utils';
import { SettingsService } from './settings.service';

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
        return _join(this.settings.sharedPath, this.settings.notFoundPage);
    }

    get bookLoc () {
        return join(this.settings.rootLoc, this.settings.bookPath);
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
        const url = filename ? join(dir, filename) : null;
        const item = await this.get(url).toPromise();
        if (!item) {
            throw new Error('Possible cache error');
        }
        return item.notFound || !url ? null : item.resolvedPath;
    }

    // 用于查找图片，其中 root 是 http://127.0.0.1:10080/website/writer/name
    // from 是 md 文件path，to 是图片文件path
    async findup(root: string, from: string, to: string): Promise<string> {
        if(!from.startsWith('/')) from = '/'+from;

        const re = new RegExp(/\.md$/)
        from = re.test(from) ? _join(from, '..') : from;
        const url = to ? join(root, join(from, to)) : null;
        const item = await this.get(url).toPromise();

        if (!item) {
            throw new Error('Possible chache error');
        }

        if ( item.notFound ) {
            if (from === '/') return null;

            from = normalize(_join(from, '..'));
            return from === '/' 
                ? await this.find(root, join(from, to)) 
                : this.findup(root, from, to);
        }

        return item.resolvedPath;
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
