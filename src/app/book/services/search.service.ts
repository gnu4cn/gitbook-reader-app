import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import {
    map,
    mergeMap,
    catchError,
    filter
} from "rxjs/operators";

import unified from 'unified';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import slug from 'remark-slug';
import { links, images } from '../shared/links';
import frontmatter from 'remark-frontmatter';
import { getTitle } from '@swimlane/docspa-remark-preset';

import { ElectronService } from 'ngx-electron';

import { FetchService } from './fetch.service';
import { SettingsService } from './settings.service';
import { LocationService } from './location.service';
import { TocService } from '../markdown-elements/toc.service';

import { VFile } from '../book.vendor';
import { REGEXP_ZH } from '../../vendor';
import { join } from '../shared/utils';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private minDepth = 1;
    private maxDepth = 6;
    private _searchIndex;

    constructor(private fetchService: FetchService,
        private locationService: LocationService,
        private electronService: ElectronService,
        private settings: SettingsService,
        private tocService: TocService
    ) {}

    // search segment
    private get processor() {
        return unified() // md -> toc -> md + links
            .use(markdown)
            .use(frontmatter)
            .use(slug)
            .use(getTitle as any)
            .use(this.tocService.removeNodesPlugin, this.minDepth)
            .use(this.tocService.tocPlugin, { maxDepth: this.maxDepth })
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(this.tocService.linkPlugin)
            .use(stringify);
    }


    get bookPath() {
        return this.settings.bookPath;
    }

    loadSummary() {
        return of(this.electronService.ipcRenderer.sendSync('summary-request', this.bookPath)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        );
    }

    private generateSearchIndex(paths: Array<string>) {
        if (!paths) {
            this._searchIndex = null;
            return;
        }

        // 这里 paths 是个对象，字符串数组是第一个元素
        const promises = paths.map(_ => {
            const vfile = this.locationService.pageToFile(_);
            const fullPath = join(vfile.cwd, vfile.path);
            return this.fetchService.get(fullPath)
                .pipe(
                    mergeMap(resource => {
                        vfile.contents = resource.contents;
                        vfile.data = vfile.data || {};
                        return resource.notFound ? of(null) : this.processor.process(vfile);
                    })
                ).toPromise();
        });

        return Promise.all(promises).then(files => {
            this._searchIndex = files.reduce((acc: Array<any>, f: VFile): Array<any> => {
                return f ? [...acc, f.data.tocSearch] : acc;
            }, []);
        });
    }

    async search(query: string) {
        if(this._searchIndex){
            await this.loadSummary().subscribe(paths => {
                this.generateSearchIndex(paths);
            });
        }

        if (typeof query !== 'string' || query.trim() === '') {
            return null;
        }

        const regEx = new RegExp(
            query.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'),
            'gi'
        );

        const matchingResults = [];

        await this._searchIndex.forEach(link => {
            const zh = REGEXP_ZH.test(query);

            const index = zh ? link.content.indexOf(query) : link.content.search(regEx);
            if (index > -1) {
                const start = index < 21 ? 0 : index - 20;
                const end = start + 40;
                const content = link.content
                    .substring(start, end)
                    .replace(zh ? query : regEx, 
                        zh ? `<em class="search-keyword">${query}</em>` : x => `<em class="search-keyword">${x}</em>`);

                matchingResults.push({
                    ...link,
                    content
                });
            }
        });

        return matchingResults;
    }
}
