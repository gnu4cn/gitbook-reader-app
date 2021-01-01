import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { map, share, catchError } from 'rxjs/operators';
import { PrivateTokensService } from './private-tokens.service';

@Injectable({
    providedIn: 'root'
})
export class FetchService {
    private inFlight = new Map<string, Observable<object|object[]>>();

    constructor(
        private http: HttpClient,
        private tokens: PrivateTokensService
    ) {}

    /**
     *
     * @param url {string} Full path relative to root
     */
    get = (url: string, header: string): Observable<object|object[]> => {
        if (!url) {
            return of(JSON.parse(''));
        }

        if (this.inFlight.has(url)) {
            return this.inFlight.get(url);
        }

        const headers = new HttpHeaders(header);
        const obs: Observable<object|object[]> = this.http
        .get(url, {headers: headers, responseType: 'json'})
        .pipe(
            catchError((e) => {
                return of(e);
            }),
            map((data: object | object[]) => {
                this.inFlight.delete(url);
                return data;
            }),
            share()
        );

        this.inFlight.set(url, obs);
        return obs;
    }

    getWriterProfile = (writerName: string, websiteUri: string): Promise<object|object[]> => {
        let url: string;
        let header: string;

        if(/github/.test(websiteUri)) {
            url = `https://api.github.com/users/${writerName}`;
            header = 'Accept: application/vnd.github.v3+json';
        }

        if(/gitlab/.test(websiteUri)) {
            url = `https://gitlab.com/api/v4/users?username=${writerName}`;
            header = `PRIVATE-TOKEN: ${this.tokens.gitlabToken}`;
        }

        if(/gitee/.test(websiteUri)) {
            url = `https://gitee.com/api/v5/users/${writerName}?access_token=${this.tokens.giteeToken}`;
            header = 'Content-Type: application/json;charset=UTF-8';
        }

        return this.get(url, header).toPromise();
    }

    getRepoProfile = (website: string, repo: string, owner: string, ownerId?: number): Promise<object|object[]> => {
        let url: string;
        let header: string;

        if(/github/.test(website)) {
            url = `https://api.github.com/repos/${owner}/${repo}`;
            header = "Accept: application/vnd.github.v3+json";
        }

        if(/gitlab/.test(website) && ownerId) {
            url = `https://gitlab.com/api/v4/users/${ownerId}/projects`;
            header = `PRIVATE-TOKEN: ${this.tokens.gitlabToken}`;
        }

        if(/gitee/.test(website)) {
            url = `https://gitee.com/api/v5/repos/${owner}/${repo}?access_token=${this.tokens.giteeToken}`;
            header = 'Content-Type: application/json;charset=UTF-8';
        }

        return this.get(url, header).toPromise();
    }

    searchBooks = (websiteUri: string, keywords: string): Promise<object|object[]> => {
        let url: string;
        let header: string;

        if(/github/.test(websiteUri)) {
            const q = encodeURIComponent(keywords + ' filename:SUMMARY.md');
            url = `https://api.github.com/search/repositories?q=${q}`;
            header = "Accept: application/vnd.github.v3+json";
        }

        if(/gitee/.test(websiteUri)) {
            const q = encodeURIComponent(keywords);
            url = `https://gitee.com/api/v5/search/repositories?access_token=${this.tokens.giteeToken}&q=${q}=1&per_page=20&order=desc`;
            header = "Content-Type: application/json;charset=UTF-8";
        }

        if(/gitlab/.test(websiteUri)){
            const q = encodeURIComponent(keywords);
            url = `https://gitlab.com/api/v4/search?scope=projects&search=${q}`;
            header = `PRIVATE-TOKEN: ${this.tokens.gitlabToken}`;
        }

        return this.get(url, header).toPromise();
    }
}
