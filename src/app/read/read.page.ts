import {
    Component, OnInit, ViewChild, Renderer2,
    HostListener, ViewEncapsulation, SimpleChanges,
    AfterViewInit, 
    OnDestroy, 
    ElementRef
} from '@angular/core';

import { Title, Meta, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { parse } from 'url';

import { HooksService } from '../book/services/hooks.service';
import { RouterService } from '../book/services/router.service';
import { SettingsService } from '../book/services/settings.service';
import { PrintService } from '../book/services/print.service';
import { CrudService } from '../services/crud.service';
import { MessageService } from '../services/message.service';

import { throttleable } from '../book/shared/throttle';

import type { VFile } from '../book/shared/vfile';
import type { IReadingProgress, IMessage } from '../vendor';

@Component({
    selector: 'app-read',
    templateUrl: './read.page.html',
    styleUrls: ['./read.page.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ReadPage implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('coverMain') coverMain: any;
    contentPage: string;
    navbarPage: string;
    coverPage: string;
    sidebarPage: string;
    rightSidebarPage: string;
    footerPage: string;
    anchor: string;
    inScrollHashes: Set<string>;
    searchResults: any[];
    private isElectron: boolean;
    private website: string = '';
    private writer: string = '';
    book: string = '';
    private bookPath: string;
    private subTitle: string;

    private sidebarClose = false;

    constructor(
        private settings: SettingsService,
        private routerService: RouterService,
        private renderer: Renderer2,
        private titleService: Title,
        private metaService: Meta,
        private hooks: HooksService,
        private activatedRoute: ActivatedRoute,
        private message: MessageService,
        private printService: PrintService,
        private crud: CrudService,
    ) {
        this.setupRouter();
    }

    get storageId () {
        return `${this.website}:${this.writer}:${this.book}`
    }

    get readingProgress () {
        return {
            url: parse(this.routerService.url).pathname,
            title: this.subTitle,
            sections: Array.from(this.inScrollHashes),
            bookCommit: localStorage.getItem(this.storageId)
        }
    }

    // TODO: Move to a scroll spy event on EmbedMarkdownComponent
    //@HostListener('window:scroll', [])

    @HostListener('window:scroll', [])
    @throttleable(30)
    onWindowScroll() {
        let add = true;
        let coverHeight = 0;
        if (this.coverMain) {
            const cover = this.coverMain.nativeElement;
            coverHeight = cover.getBoundingClientRect().height;
            add = window.pageYOffset >= coverHeight || cover.classList.contains('hidden');
        }

        this.renderer[add ? 'addClass' : 'removeClass'](document.body, 'sticky');
    }

    toggleSidebar(nextState: boolean = !this.sidebarClose) {
        this.sidebarClose = nextState;
        localStorage.setItem('GbrComponent#sidebarClose', String(this.sidebarClose));
        this.renderer[this.sidebarClose ? 'addClass' : 'removeClass'](document.body, 'close');
    }

    print(){
        window.frames['print-frame'].print();
    }

    clearSearchResults(){
        this.searchResults = null;
    }

    ngOnInit() {
        this.crud.ipcRenderer.send('book-loading');

        this.crud.ipcRenderer.on('request-reading-progress', async (ev) => {
            const progress: IReadingProgress = await this.readingProgress;

            ev.sender.send('reply-reading-progress', progress);
        });

        const sidebar = localStorage.getItem('GbrComponent#sidebarClose') || 'false';
        this.toggleSidebar(sidebar === 'true');

        this.hooks.doneEach.tap('main-content-loaded', (page: VFile) => {
            if (page.data.gbr.isPageContent) {
                this.mainContentLoaded(page);

                this.printService.printCurrent(true, this.routerService.contentPage).then(html => {
                    const msg: IMessage = {
                        event: 'print-content-updated',
                        data: html
                    }
                    this.message.sendMessage(msg);
                });
            }
        });

        this.hooks.mounted.call();
    }

    ngAfterViewInit() {
        this.hooks.ready.call();
    }

    ngOnDestroy() {
        this.hooks.destroy.call();

    }

    mainContentLoaded(page: VFile) {
        let title = this.settings.name;
        if (page.data) {
            if (page.data.matter && page.data.matter.title) {
                this.subTitle = page.data.matter.title;
            } else if (page.data.title) {
                this.subTitle = page.data.title;
            }
        }
        if (this.subTitle && this.subTitle !== title) {
            title += ' - ' + this.subTitle;
        }

        // TODO: move these to a plugin, make optional
        this.titleService.setTitle(title);

        ['description', 'keywords', 'author'].forEach(name => {
            const content = page.data && page.data.matter && page.data.matter[name] || this.settings.meta[name];
            if (content) {
                this.metaService.updateTag({ name: name, content });
            } else {
                this.metaService.removeTag(name);
            }
        });

        this.renderer.addClass(document.body, 'ready');

        this.onWindowScroll();
    }

    private pathChanges(changes: SimpleChanges) {
        if ('anchor' in changes) {
            this.anchor = changes.anchor.currentValue;
        }

        if ('contentPage' in changes && this.contentPage !== changes.contentPage.currentValue) {

            this.contentPage = changes.contentPage.currentValue;

            // if the page changes, and no anchor is given, scroll top the top
            if ('anchor' in changes && changes.anchor.currentValue === '') {
                this.anchor = 'content-top';
            }
        }

        if ('coverPage' in changes) {
            this.coverPage = changes.coverPage.currentValue;
        }

        if (changes.sideLoad) {
            const sideLoad = changes.sideLoad.currentValue;
            this.sidebarPage = sideLoad.sidebar;
            this.navbarPage = sideLoad.navbar;
            this.rightSidebarPage = sideLoad.rightSidebar;
            this.footerPage = sideLoad.footer;
        }

        // TODO: ready event from sub components?
        setTimeout(() => {
            if ('coverPage' in changes) {
                this.onWindowScroll();
            }
        }, 30);
    }

    private setupRouter() {
        // Watch for changes in the this component's actived route,
        // pass that on to router servce
        combineLatest([this.activatedRoute.url, this.activatedRoute.fragment])
            .subscribe(async () => {

                await this.activatedRoute.paramMap.subscribe(params => {
                    this.website = params.get('website');
                    this.writer = params.get('writer');
                    this.book = params.get('book');
                    this.settings.bookPath = this.bookPath = `/${this.website}/${this.writer}/${this.book}`;
                })

                await this.activatedRoute.queryParamMap.subscribe(params => {
                    const commit = params.get('bookCommit');

                    const _commit = localStorage.getItem(this.storageId) || '';
                    if (commit && commit !== _commit) {
                        this.settings.updated = true;
                        localStorage.setItem(this.storageId, commit);
                    }
                    else this.settings.updated = false;
                });

                //                this.routerService.activateRoute(this.activatedRoute.snapshot);
                this.routerService.activateRoute();
            });

        // Respond to changes in the docspa route
        this.routerService.changed.subscribe((changes: SimpleChanges) => this.pathChanges(changes));
    }
}
