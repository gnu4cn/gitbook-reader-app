import {
    Component,
    OnInit,
    ViewEncapsulation,
    HostBinding
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { SearchService } from '../services/search.service';
import { MarkdownService } from '../markdown/markdown.service';

@Component({
    selector: 'docspa-toc', // tslint:disable-line
    template: ``,
    encapsulation: ViewEncapsulation.None
})
export class SummaryComponent implements OnInit {
    static readonly is = 'md-summary';

    @HostBinding('innerHTML')
    html: SafeHtml;

    constructor(
        private sanitizer: DomSanitizer,
        private markdownService: MarkdownService,
    ) {}

    ngOnInit() {
        this.load();
    }

    private load() {
        this.markdownService.loadSummary('SUMMARY.md')
            .then(_ => this.generateSummary(_));
    }

    private generateSummary(paths: Array<string>) {
        if (!paths) {
            this.html = '';
            return;
        }

        // 这里 paths 是个对象，字符串数组是第一个元素
        const promises = paths.map(_ => {
            return this.markdownService.getPageToc(_)
                .toPromise();
        });

        return Promise.all(promises).then(files => {
            const _html = (files.reduce((acc: string, f: any): string => {
                return f ? acc.concat(f.contents) : acc;
            }, '') as string);

            this.html = this.sanitizer.bypassSecurityTrustHtml(_html);
        });
    }
}
