import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import {
    mergeMap,
    catchError,
} from "rxjs/operators";

import remark from 'remark';
import stringify from 'remark-stringify';
import slug from 'remark-slug';
import { links, images } from '../shared/links';
import frontmatter from 'remark-frontmatter';

import { getTitle } from '../../gbr-preset';
import { FetchService } from './fetch.service';
import { LocationService } from './location.service';
import { MarkdownService } from '../markdown/markdown.service';

import { removeNodesPlugin } from '../plugins/remove'
import { tocPlugin } from '../plugins/toc';
import lazyInitialize from '../shared/lazy-init';

import { VFile } from '../shared/vfile';
import { REGEXP_ZH } from '../../vendor';
import { join } from '../shared/utils';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private minDepth = 1;
    private maxDepth: 1 | 6 | 2 | 3 | 4 | 5 = 6;
    private searchIndex;

    constructor(private fetchService: FetchService,
        private locationService: LocationService,
        private markdownService: MarkdownService,
    ) {}

    // search segment
    @lazyInitialize
    private get processor() {
        return remark() // md -> toc -> md + links
            .use(frontmatter)
            .use(slug)
            .use(getTitle as any)
            .use(removeNodesPlugin, {minDepth: this.minDepth})
            .use(tocPlugin, {maxDepth: this.maxDepth })
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(this.markdownService.linkPlugin)
            .use(stringify);
    }

    private generateSearchIndex = (paths: Array<string>) => {
        if (!paths) {
            this.searchIndex = null;
            return;
        }

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

        Promise.all(promises).then(files => {
            this.searchIndex = files.reduce((acc: Array<any>, f: VFile): Array<any> => {
                // 这里这句代码要命，很容易写错..., 少写三个点就完全不一样了的 :)
                //return f ? [...acc, f.data.tocSearch] : acc;
                return f ? [...acc, ...f.data.tocSearch] : acc;
                // 第二种写法
                // return f ? acc.concat(f.data.tocSearch) : acc;
            }, []);
        });
    }

    init = async () => {
        if(!this.searchIndex){
            this.markdownService.loadSummary('SUMMARY.md')
                .then(_ => this.generateSearchIndex(_));
        }
    }

    async search(query: string) {
        this.init();

        if (typeof query !== 'string' || query.trim() === '') {
            return null;
        }

        const regEx = new RegExp(
            query.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'),
            'gi'
        );

        const matchingResults = [];

        await this.searchIndex.forEach(link => {
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
