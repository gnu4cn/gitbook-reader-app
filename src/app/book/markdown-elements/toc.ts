import {
    Component,
    Input,
    OnInit,
    ViewEncapsulation,
    HostBinding
} from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { RouterService } from '../services/router.service';
import { HooksService } from '../services/hooks.service';
import { TocService } from './toc.service';

import type { VFile } from '../book.vendor';

@Component({
    selector: 'docspa-toc', // tslint:disable-line
    template: ``,
    encapsulation: ViewEncapsulation.None
})
export class TOCComponent implements OnInit {
    static readonly is = 'md-toc';

    @Input()
    path: string;

    @Input()
    plugins = false;

    @Input()
    minDepth = 1;

    @Input()
    maxDepth = 6;

    @Input()
    tight = true;

    @HostBinding('innerHTML')
    html: SafeHtml;

    private lastPath: string;

    private page;

    constructor(
        private routerService: RouterService,
        private sanitizer: DomSanitizer,
        private hooks: HooksService,
        private tocService: TocService
    ) {}

    ngOnInit() {

        this.hooks.doneEach.tap('main-content-loaded', (page: VFile) => {
            if (page.data.gbr.isPageContent) {
                // load or update after main content changes
                this.load();
            }
        });
    }

    private load() {
        const page  = this.path || decodeURI(this.routerService.contentPage);

        // Not a page, clear
        if (typeof page !== 'string' || page.trim() === '') {
            this.html = '';
            this.lastPath = page;
            return;
        }

        // TOC content hasn't changed,
        if (page === this.lastPath) { return; }

        this.tocService.tocVfile(page).subscribe(_vfile => {
            this.html = this.sanitizer.bypassSecurityTrustHtml(_vfile.contents as string);
            this.lastPath = page;
        });
    }
}
