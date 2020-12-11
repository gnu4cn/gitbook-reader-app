import { Injectable } from '@angular/core';
import { LocationStrategy, PlatformLocation } from '@angular/common';
import { Router } from '@angular/router';

import { extname, dirname } from 'path';
import VFILE from 'vfile';
import { resolve, parse } from 'url';

import { join, isAbsolutePath, stripBaseHref  } from '../shared/utils';

import { SettingsService } from './settings.service';
import { REGEXP_ABS_URL } from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    get sideLoad() {
        return this.settings.sideLoad;
    }

    get sharedPath() {
        return this.settings.sharedPath;
    }

    get rootPath() {
        return this.settings.rootPath;
    }

    get bookPath() {
        return this.settings.bookPath;
    }

    get currentWorkingPath(): string {
        const url = parse(this.router.url);
        const regex = new RegExp(/.md/)
        // 测试 url 中是否有 .md, 没有则为首页，vfile.cwd 就是 /:writer/:name, 否则 vfile.cwd 为后面构造的路径
        return extname(url.pathname) === '' ? this.bookPath : join(this.rootPath, dirname(url.pathname));
    }

    get ext() {
        return this.settings.ext;
    }

    private baseHref: string;

    constructor(
        private settings: SettingsService,
        private router: Router,
        private platformStrategy: LocationStrategy
    ) {
        this.baseHref = this.platformStrategy.getBaseHref();
    }

    /**
     * Convert a page string to a virtual file
     */
    private isShared = (basename: string) => {
        const _mds: Array<string> = [];
        Object.keys(this.sideLoad).map((k, i) => {
            _mds.push(this.sideLoad[k]);
        });
        _mds.push(this.settings.notFoundPage);

        const index = _mds.findIndex(n => n === basename);
        return index >= 0;
    }

    pageToFile(page: string = ''): VFILE.VFile {
        page = page.replace(/^#/, '');
        if (page === '') {
            page = '/';
        }

        // 测试 page 是本地还是远程的 md 文件，以加入对远程 md 文件的支持
        const vfile = VFILE({ path: page, cwd: REGEXP_ABS_URL.test(page) ? '' : this.currentWorkingPath});

        const isHomepage = page.slice(-1) === '/';
        if (isHomepage) {
            vfile.path = join(vfile.path, this.settings.homepage);
        }

        if (vfile.basename === '') {
            vfile.basename = this.settings.homepage;
        }

        if (vfile.extname === '') {
            vfile.extname = this.settings.ext;
        }

        const _url = join(this.isShared(vfile.basename) ? '' : vfile.cwd, vfile.path);

        vfile.data = {
            gbr: {
                url: _url
            }
        };

        return vfile;
    }

    /**
     * Return a resolved url relative to the base path
     */
    prepareLink(href: string, base: string = '/') {
        if (isAbsolutePath(href)) { return href; }
        return resolve(base, stripBaseHref(this.baseHref, href));
    }

    /**
     * Return a resolved url relative to the base path
     */
    prepareSrc(src: string, base: string = '') {
        if (isAbsolutePath(src)) { return src; }
        return join(this.currentWorkingPath, resolve(base, src));
    }

    /**
     * Removes the base path from a url
     */
    stripBasePath(url: string): string {
        if (!url) { return null; }
        return stripBaseHref(this.bookPath, url);
    }
}
