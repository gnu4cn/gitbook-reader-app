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

import { join, isAbsolutePath } from '../shared/utils';

import type { VFile } from '../shared/vfile';
import type { Heading } from '../shared/ast';

@Injectable({
    providedIn: 'root'
})
export class PrintService {
    constructor(
        private fetchService: FetchService,
        private locationService: LocationService,
        private sanitizer: DomSanitizer,
        private markdownService: MarkdownService,
    ) {}
    
    async printCurrent(safe: boolean, contentPage){
        const toc_vfile = this.locationService.pageToFile('toc');
        const res = await this.markdownService.getPageToc(contentPage).toPromise();

        const f = await this.fetchVfile(contentPage);

        const content =`<h2 float="left">目 录</h2><br>${res.contents}<hr><article class="print-page">${f.contents}</article>`; 
        return safe ? this.sanitizer.bypassSecurityTrustHtml(content) : content;
    }

    async fetchVfile(path: string){
        const vfile = this.locationService.pageToFile(path);
        const url = join(vfile.cwd, vfile.path);
        const res = await this.fetchService.get(url).toPromise();
        vfile.contents = res.contents;
        return this.markdownService.process(vfile);
    }
}
