import { Injectable, EventEmitter, SimpleChange, SimpleChanges } from '@angular/core';
import { 
    Router, 
//    ActivatedRouteSnapshot 
} from '@angular/router';

import { goExternal, isAbsolutePath } from '../shared/utils';
import { getFullPath, VFile } from '../shared/vfile';
import { parse } from 'url';

import { SettingsService } from './settings.service';
import { FetchService } from './fetch.service';
import { LocationService } from './location.service';
import { join } from '../shared/utils';

@Injectable({
    providedIn: 'root'
})
export class RouterService {
    url: string;
    page: string;
    anchor: string;
    file: string;
    root: string;

    contentPage: string;

    /**
     * Emitted whenever page content changes, include side loaded content
     */
    changed = new EventEmitter<SimpleChanges>();

    constructor(
        private settings: SettingsService,
        private fetchService: FetchService,
        private locationService: LocationService,
        private router: Router
    ) {}

    get bookPath () {
        return this.settings.bookPath;
    }

    get _url () {
        return parse(this.router.url);
    }

    //activateRoute(snapshot: ActivatedRouteSnapshot) {
    activateRoute() {
        let path: string = '';
        try {
            path = decodeURIComponent(this._url.pathname);
        }catch(e){console.log(e)};
        const fragment = this._url.hash ? decodeURI(this._url.hash) : '';

        let re = new RegExp(/\.md/)
        const notHomePage = re.test(path);

        let url: string;
        let root: string;
        if(notHomePage){
            url = path.replace(this.bookPath, '');
            root = path.replace(url, '');
            root = root.endsWith('/') ? root : root+'/';
        }
        else{
            url = '';
            root = path.endsWith('/') ? path : path+'/';
        }

        // 去掉首尾的 '/'
        url = url.replace(/^\//, '').replace(/\/$/, '');

        path = url+fragment;
        console.log(this._url, path, root)
        this.go(path, root);
    }

    go(url: string, root = this.root) {
        url = url || '/';
        if (isAbsolutePath(url)) {
            goExternal(url);
            return Promise.resolve({});
        }
        return this.urlChange(url || '/', root);
    }

    private async urlChange(url: string = '/', root = this.root) {
        const changes: SimpleChanges = {};

        if (this.root !== root) {
            changes.root = new SimpleChange(this.root, this.root = root, false);
        }

        if (this.url !== url) {
            changes.url = new SimpleChange(this.url, this.url = url, false);
        }

        let [page = '/', anchor = ''] = url.split(/[#\?]/);

        anchor = anchor || '';
        page = page || '/';

        const vfile = this.locationService.pageToFile(page);

        if (anchor.includes('id=')) {
            const params = new URLSearchParams(anchor);
            anchor = params.get('id');
        }
        if (this.anchor !== anchor) {
            changes.anchor = new SimpleChange(this.anchor, this.anchor = anchor, false);
        }

        if (this.contentPage !== page) {
            changes.contentPage = new SimpleChange(this.contentPage, this.contentPage = page, false);

            const [coverPage, sideLoads] = await Promise.all([
                this.resolveCoverPath(vfile),
                this.resolveSideloadPaths()
            ]);

            changes.coverPage = new SimpleChange(null, coverPage, false);
            changes.sideLoad = new SimpleChange(null, sideLoads, false);
        }

        //return changes;
        if (Object.keys(changes).length > 0) {
            this.changed.emit(changes);
        }
    }

    private async resolveCoverPath(vfile: VFile) {
        const path = vfile.basename === this.settings.homepage ?
            await this.fetchService.find(getFullPath(vfile), this.settings.coverpage) :
            null;
        return this.locationService.stripBasePath(path);
    }

    private async resolveSideloadPaths() {
        const sideLoad = this.settings.sideLoad;
        const keys = Object.keys(sideLoad);

        //return keys.reduce((acc: {[key: string]: string}, _key: string, idx: number): {[key: string]: string} => {
        return keys.reduce((acc: {[key: string]: string}, _key: string): {[key: string]: string} => {
            //const key = keys[idx];
            if(_key) acc[_key] = join(this.settings.sharedPath, sideLoad[_key]);
            return acc;
        }, {})as {[key: string]: string};
    }
}
