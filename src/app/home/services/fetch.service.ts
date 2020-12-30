import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { map, share, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class FetchService {
    private inFlight = new Map<string, Observable<JSON>>();

    constructor(
        private http: HttpClient,
    ) {}

    /**
     *
     * @param url {string} Full path relative to root
     */
    get = (url: string, header: string): Observable<JSON> => {
        if (!url) {
            return of(JSON.parse(''));
        }

        if (this.inFlight.has(url)) {
            return this.inFlight.get(url);
        }

        const headers = new HttpHeaders(header);
        const obs: Observable<JSON> = this.http
        .get(url, {headers: headers, responseType: 'json'})
        .pipe(
            catchError((e) => {
                return of(e);
            }),
            map((data: JSON) => {
                this.inFlight.delete(url);
                return data;
            }),
            share()
        );

        this.inFlight.set(url, obs);
        return obs;
    }

    fetchWriterProfile = (writerName: string, websiteUri: string): Observable<JSON> => {
        let url: string;
        let header: string;
        if(/github/.test(websiteUri)) {
            url = `https://api.github.com/users/${writerName}`;
            header = 'Accept: application/vnd.github.v3+json';
        }

        if(/gitee/.test(websiteUri)) {
            url = `https://gitee.com/api/v5/users/${writerName}?access_token=e1edaa5796b86a5f0d9a407ee7be4804`;
            header = 'Content-Type: application/json;charset=UTF-8';
        }

        if(/gitlab/.test(websiteUri)) {
            url = `https://gitlab.com/api/v4/users?username=${writerName}`;
            header = 'PRIVATE-TOKEN: Mq9hCC8FrTZA3wxSjQqF';
        }

        return this.get(url, header);
    }

    searchBooks = (websiteUri: string, keywords: string): Observable<JSON> => {
        let url: string;
        let header: string;

        if(/github/.test(websiteUri)) {
            const q = encodeURIComponent(keywords + ' filename:SUMMARY.md');
            url = `https://api.github.com/search/repositories?q=${q}`;
            header = "Accept: application/vnd.github.v3+json";
        }

        if(/gitee/.test(websiteUri)) {
            const q = encodeURIComponent(keywords);
            url = `https://gitee.com/api/v5/search/repositories?access_token=e1edaa5796b86a5f0d9a407ee7be4804&q=${q}=1&per_page=20&order=desc`;
            header = "Content-Type: application/json;charset=UTF-8";
        }

        if(/gitlab/.test(websiteUri)){
            const q = encodeURIComponent(keywords);
            url = `https://gitlab.com/api/v4/search?scope=projects&search=${q}`
            header = "PRIVATE-TOKEN: Mq9hCC8FrTZA3wxSjQqF"
        }

        return this.get(url, header);
    }
}
