import { Injectable, Inject, Optional } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

import deepmerge from 'deepmerge'; // use xtend?

import { GBR_CONFIG_TOKEN } from '../gbr.tokens';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    name = '';
    meta = {};

    homepage = 'README.md';
    sideLoad: {[key: string]: string } = {};

    coverpage = '';
    private _bookPath = 'assets';
    // nameLink = '';
    ext = '.md';
    notFoundPage = '_404.md';
    maxPageCacheSize = 100;
    private readonly _rootPath: string = 'assets';
    private _sharedPath: string = 'assets/shared';
    private _updated: boolean = false;

    constructor(
        metaService: Meta,
        titleService: Title,
        @Optional() @Inject(GBR_CONFIG_TOKEN) config: any
    ) {
        if (config) {
            this.merge(config);
        }

        this.name = this.name || titleService.getTitle();

        // Get intial meta tags for later
        metaService.getTags('name').forEach(elm => {
            const name = elm.name;
            this.meta[name] = this.meta[name] || elm.content;
        });
    }

    get updated () {
        return this._updated;
    }

    set updated (s: boolean) {
        this._updated = s;
    }

    get rootPath(): string {
        return this._rootPath;
    }

    get sharedPath(): string {
        return this._sharedPath;
    }

    get bookPath(): string {
        return this._bookPath;
    }

    set bookPath(path: string) {
        this._bookPath = path;
    }

    private merge(opts: Partial<SettingsService>) {
        Object.assign(this, deepmerge(this, opts));
    }
}
