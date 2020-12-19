import { Injectable } from '@angular/core';
import { LocationStrategy, PlatformLocation } from '@angular/common';
import { Router } from '@angular/router';

import { extname, dirname, join as _join, resolve} from 'path';
import VFILE from 'vfile';

import { isAbsolutePath, stripBaseHref  } from '../shared/utils';
import { join } from '../shared/utils';

import { SettingsService } from './settings.service';
import { FetchService } from './fetch.service';

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

    get bookPath() {
        return this.settings.bookPath;
    }

    get rootLoc() {
        return this.settings.rootLoc;
    }

    get bookLoc() {
        return join(this.rootLoc, this.bookPath);
    }

    get ext() {
        return this.settings.ext;
    }

    private baseHref: string;

    constructor(
        private settings: SettingsService,
        private router: Router,
        private fetchService: FetchService,
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
        const vfile = VFILE({ path: page, cwd: isAbsolutePath(page) ? '' : this.bookLoc});

        if (vfile.basename === '') {
            vfile.basename = this.settings.homepage;
        }

        if (vfile.extname === '') {
            vfile.extname = this.settings.ext;
        }

        const _path = vfile.path === '/' ? this.settings.homepage : vfile.path;
        const _url = this.isShared(vfile.basename) ? vfile.path : join(vfile.cwd, _path);

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
        return join(base, stripBaseHref(this.baseHref, href));
    }

    /**
     * Return a resolved url relative to the base path
     */
    prepareSrcAsync = async (src: string, base: string = '') => {
        if (isAbsolutePath(src)) return src; 

        const notFound = '/assets/images/image-not-found.jpg';
        let res: string;

        await this.fetchService.findup(this.bookLoc, base, src).then(p => {
            res = p;
        });

        return res ? res : notFound;
    }

    prepareSrc(src: string, base: string = '') {
        if (isAbsolutePath(src)) { return src; }
        return join(this.bookLoc, _join(base, src));
    }

    /**
     * Removes the base path from a url
     */
    stripBasePath(url: string): string {
        if (!url) { return null; }
        return stripBaseHref(this.rootLoc, url);
    }
}
