import { Directive, ElementRef, SimpleChanges, Renderer2, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';

import { throttleable } from '../shared/throttle';

@Directive({
    selector: '[listCollapse]'
})
export class ListCollapseDirective implements OnInit, OnChanges, OnDestroy {
    // an array of active hash
    @Input()
    listCollapse: string[] = [];

    // an array of anchors in this element
    @Input()
    tocLinks: HTMLAnchorElement[];

    private mutationObserver: MutationObserver;

    constructor(private elm: ElementRef, private renderer: Renderer2) {}

    ngOnInit() {
        this.mutationObserver = new MutationObserver(async () => {
            // 这里应该是异步的，否者可能 `this.tocLinks` 没准备好
            await this.getTocLinks();
            this.markLinks();
        });
        this.mutationObserver.observe(this.elm.nativeElement, { childList : true, subtree: true });
    }

    // if list of hashs changes, update links
    ngOnChanges(changes: SimpleChanges) {
        if ('listCollapse' in changes) {
            this.markLinks();
        }
    }

    ngOnDestroy() {
        if (this.mutationObserver) { this.mutationObserver.disconnect(); }
    }

    private getTocLinks() {
        this.tocLinks = Array.prototype.slice.call(this.elm.nativeElement.querySelectorAll('ul > li > a'));
    }

    @throttleable(120)
    private markLinks() {
        if (!this.tocLinks) { return; }

        // clear
        for (let i = 0; i < this.tocLinks.length; i++) {
            const a = this.tocLinks[i];
            this.renderer.removeClass(a, 'active');
            this.updateTree(a, false);
        }

        // set
        for (let i = 0; i < this.tocLinks.length; i++) {
            const a = this.tocLinks[i];
            if (this.isHashActive(a)) {
                this.renderer.addClass(a, 'active');
                this.updateTree(a, true);
            }
        }
    }

    /**
     * Determines if a link's hash is active
     * @param a
     */
    private isHashActive(a: HTMLAnchorElement) {
        if (a.classList.contains('router-link-active')) {
            // 在 LocationStrategy 修改为 HashLocationStrategy 后，这里要争取的得到 fragment, 必须进行修改
            const hash = a.hash.replace(/#.{1,}#/, '');

            return !hash || (this.listCollapse || []).includes(decodeURI(hash));
        }
        return false;
    }

    private updateTree(elem: Element, isActive: boolean) {
        const action = isActive ? 'addClass' : 'removeClass';

        let p = elem.parentNode;
        // walk up dom to set active class
        while (p && ['LI', 'UL', 'P'].includes(p.nodeName)) {
            this.renderer[action](p, 'active');
            p = p.parentNode;
        }
    }
}
