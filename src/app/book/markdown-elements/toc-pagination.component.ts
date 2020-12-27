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
import { getBasePath } from '../shared/vfile';

import type { VFile } from '../shared/vfile';

interface FileIndexItem {
    title: string;
    path: string;
    link: string | string[];
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
    ) {}

    ngOnInit() {
        this.load();
    }

    ngOnChanges() {
        this.load();
    }

    private load = async () => {
        if (!this.files) {
            await this.markdownService.loadSummary('SUMMARY.md')
                .then(_ => _.subscribe(paths => this.generatePageIndex(paths)));
        }

        this.routerService.changed.subscribe((changes: SimpleChanges) => {
            if ('contentPage' in changes) {
                this.pathChanges(changes.contentPage.currentValue);
            }
        });

        this.pathChanges(this.routerService.contentPage);
    }

    private pathChanges = (path: string) => {
        //if(!path) path = 'README.md';
        path = decodeURIComponent(path);

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

                const fileIndexItem = {
                    path,
                    title: file.data.title,
                    link,
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
