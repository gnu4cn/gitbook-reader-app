import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { of } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

import remark from 'remark';
import visit from 'unist-util-visit';
import slug from 'remark-slug';
import * as MDAST from 'mdast';
import frontmatter from 'remark-frontmatter';
import rehypeStringify from 'rehype-stringify';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';

import { images } from '../shared/links';
import { LocationService } from '../services/location.service';
import { FetchService } from '../services/fetch.service';
import { SettingsService } from '../services/settings.service';
import { MarkdownService } from '../markdown/markdown.service';
import { TocService } from '../markdown-elements/toc.service';

import { join, isAbsolutePath } from '../shared/utils';

import type { VFile } from '../shared/vfile';
import type { Heading } from '../shared/ast';

@Injectable({
    providedIn: 'root'
})
export class PrintService {
    private processor: any;
    private processLinks: any;
    private summary = 'SUMMARY';

    constructor(
        private fetchService: FetchService,
        private locationService: LocationService,
        private sanitizer: DomSanitizer,
        private markdownService: MarkdownService,
        private tocService: TocService

    ) { 
        // TODO: use tocService
        const fixLinks = () => {
            return (tree: MDAST.Root, file: VFile) => {
                return visit(tree, 'link', (node: MDAST.Link) => {
                    if (node && !isAbsolutePath(node.url)) {
                        const url = locationService.prepareLink(node.url, file.history[0]).replace(/[\/#]/g, '--');
                        node.url = `#${url}`;
                    }
                    return true;
                });
            };
        };

        // TODO: move toc servcie
        const fixIds = () => {
            return (tree: MDAST.Root, file: VFile) => {
                return visit(tree, 'heading', (node: Heading) => {
                    if (node && node.data && node.data.hProperties && node.data.hProperties.id) {
                        const id = locationService.prepareLink(`#${node.data.hProperties.id}`, file.history[0]).replace(/[\/#]/g, '--');
                        node.data.hProperties.id = node.data.id = id;
                    }
                    return true;
                });
            };
        };

        this.processLinks = remark()
            .use(frontmatter)
            .use(slug)
            .use(this.tocService.linkPlugin)
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
            .use(rehypeStringify);

        this.processor = remark()
            .use(this.markdownService.remarkPlugins)
            .use(fixLinks)
            .use(fixIds)
            .use(images, { locationService })
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
            .use(rehypeStringify);

    }

    async printWholeBook(showToc: boolean, coverpage: string, safe: boolean){
        const paths = await this.loadSummary(this.summary);

        if (showToc) {
            paths.unshift(this.summary);
        }

        if (coverpage) {
            paths.unshift(coverpage);
        }

        const p = paths.map(path => this.fetchVfile(path));

        const files = await Promise.all(p);
        const contents = files.map((f, i) => {
            const id = f.history[0].replace(/^\//, '').replace(/[\/#]/g, '--');
            return `<article class="print-page" id="${id}"><a id="--${id}"></a>${f.contents}</article>`;
        }).join('<hr class="page-break">');

        return safe ? this.sanitizer.bypassSecurityTrustHtml(contents) : contents;

    }

    async printCurrent(safe: boolean, contentPage){
        const toc_vfile = this.locationService.pageToFile('toc');
        const res = await this.tocService.tocVfile(contentPage).toPromise();

        toc_vfile.contents = res.contents;
        const toc = await this.processor.process(toc_vfile);
        const f = await this.fetchVfile(contentPage);

        const content =`<h2 float="left">目 录</h2><br>${toc.contents}<hr><article class="print-page">${f.contents}</article>`; 
        return safe ? this.sanitizer.bypassSecurityTrustHtml(content) : content;
    }

    async fetchVfile(path: string){
        const vfile = this.locationService.pageToFile(path);
        const url = join(vfile.cwd, vfile.path);
        const res = await this.fetchService.get(url).toPromise();
        vfile.contents = res.contents;
        return this.processor.process(vfile);
    }

    private loadSummary(summary: string): Promise<string[]> {
        const vfile = this.locationService.pageToFile(summary);
        const fullPath = join(vfile.cwd, vfile.path);

        return this.fetchService.get(fullPath).pipe(
            mergeMap(resource => {
                vfile.contents = resource.contents;
                vfile.data = vfile.data || {};
                return resource.notFound ? of(null) : this.processLinks.process(vfile);
            }),
            map((_: any) => {
                return _.data.tocSearch.map(__ => {
                    return __.url[0] === '/' ? __.url : '/' + __.url;
                });
            })
        ).toPromise();
    }
}
