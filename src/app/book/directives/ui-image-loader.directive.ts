import {
    Directive,
    Attribute,
    Renderer2,
    ElementRef,
    HostListener } from '@angular/core';

@Directive({
    selector: '[uiImageLoader]'
})
export class UiImageLoaderDirective {
    constructor(
        @Attribute('loader') public loader: string,
        @Attribute('onErrorSrc') public onErrorSrc: string,
        private renderer: Renderer2,
        private el: ElementRef) {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.loader);
    }

    @HostListener('load') onLoad() {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.el.nativeElement.src);
    }
    @HostListener('error') onError() {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.onErrorSrc);
    }
}
