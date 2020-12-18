import { Component, Input, OnChanges, ViewEncapsulation, SimpleChanges, OnInit } from '@angular/core';

import VFILE from 'vfile';
import unified from 'unified';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import slug from 'remark-slug';
import frontmatter from 'remark-frontmatter';
import RegexEscape from 'regex-escape';

import { RouterService } from '../services/router.service';
import { MarkdownService } from '../markdown/markdown.service';
import { SearchService } from '../services/search.service';
import { LocationService } from '../services/location.service';
import { FetchService } from '../services/fetch.service';

import { join } from '../shared/utils';
import { getBasePath } from '../shared/vfile-utils';

import type { VFile } from '../book.vendor';
import { asciiSpecialCharRegEx } from '../../vendor';

interface FileIndexItem {
    title: string;
    path: string;
    link: string | string[];
    fragment: string;
}

@Component({
    selector: 'docspa-toc-page', // tslint:disable-line
    templateUrl: './toc-pagination.component.html',
    styleUrls: ['./toc-pagination.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TOCPaginationComponent implements OnInit, OnChanges {
    static readonly is = 'md-toc-page';

    next: FileIndexItem;
    prev: FileIndexItem;

    private files: FileIndexItem[];

    constructor(
        private fetchService: FetchService,
        private routerService: RouterService,
        private markdownService: MarkdownService,
        private locationService: LocationService,
        private searchService: SearchService,
    ) {}

    ngOnInit() {
        this.load();
    }

    ngOnChanges() {
        this.load();
    }

    private load = () => {
        if (!this.files) {
            this.searchService.loadSummary().subscribe(paths => {
                this.generatePageIndex(paths).then(() => {
                    this.load();
                });
            });
        }

        this.routerService.changed.subscribe((changes: SimpleChanges) => {
            if ('contentPage' in changes) {
                this.pathChanges(changes.contentPage.currentValue);
            }
        });

        this.pathChanges(this.routerService.contentPage);
    }

    private pathChanges = (path: string) => {
        if(!path) path = 'README.md';
        path = decodeURIComponent(path);

        if(this.files === undefined){
            this.searchService.loadSummary().subscribe(paths => {
                this.generatePageIndex(paths);
            });
            return 0
        }

        // TODO: make a matches or isActive helper
        path = path.replace(/^\.\//, '');

        // If path === '/'
        path = (path === '/') ? 'README' : path;

        // The original regexp is wrong
        // const re = new RegExp(`^\.?/?${path}$`);

        const re = new RegExp(`^.*${RegexEscape(path)}.*$`);
        const index = this.files.findIndex(file => {
            return re.test(file.path);
        });

        this.prev = index > 0 ? this.files[index - 1] : null;
        this.next = index < this.files.length ? this.files[index + 1] : null;
    }

    private generatePageIndex(paths: string[]) {
        if (!paths) {
            this.files = null;
            return;
        }

        const p = paths.map(async path => {
            const _vfile = await this.fetch(path);
            await this.markdownService.process(_vfile);
            return _vfile;
        });

        return Promise.all(p).then(files => {
            this.files = files.reduce((acc: Array<FileIndexItem>, file: VFile): Array<FileIndexItem> => {
                const path = getBasePath(file);
                let link: string | string[] = this.locationService.prepareLink(path, this.routerService.root);

                // Hack to preserve trailing slash
                if (link.length > 1 && link.endsWith('/')) {
                    link = [link, ''];
                }

                const _title = file.data.title ? file.data.title : 'README，简介';
                //const _fragment = _title.split(' ').join('-');
                const _fragment = _title.toLowerCase().replace(asciiSpecialCharRegEx, '').replace(/ /g, '-');

                const fileIndexItem = {
                    path,
                    title: _title,
                    link,
                    fragment: _fragment
                };

                return file ? [...acc, fileIndexItem] : acc;

            }, []) as Array<FileIndexItem>;
        });
    }

    private async fetch(path: string) {
        let _vfile: VFile;

        if (!path) {
            _vfile = VFILE('') as VFile;
            _vfile.data.gbr.notFound = true;
        } else {
            _vfile = this.locationService.pageToFile(path) as VFile;
            const { contents, notFound } = await this.fetchService.get(_vfile.data.gbr.url).toPromise();
            _vfile.data.gbr.notFound = notFound;
            _vfile.contents = !notFound ? contents : `!> *File not found*\n!> ${path}`;
        }
        return _vfile;
    }
}
