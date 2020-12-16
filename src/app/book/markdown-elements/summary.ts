import {
    Component,
    OnInit,
    ViewEncapsulation,
    HostBinding
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { TocService } from './toc.service';
import { SearchService } from '../services/search.service';

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
        private searchService: SearchService,
        private tocService: TocService,
    ) {}

    ngOnInit() {
        this.load();
    }

    private load() {
        this.searchService.loadSummary().subscribe(paths => {
            this.generateSummary(paths);
        });
    }

    private generateSummary(paths: Array<string>) {
        if (!paths) {
            this.html = '';
            return;
        }

        // 这里 paths 是个对象，字符串数组是第一个元素
        const promises = paths.map(_ => {
            return this.tocService.tocVfile(_)
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
