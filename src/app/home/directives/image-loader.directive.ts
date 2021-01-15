import {
    Directive,
    Attribute,
    Renderer2,
    ElementRef,
    HostListener 
} from '@angular/core';

@Directive({
    selector: '[imageLoader]'
})
export class ImageLoaderDirective {
    private loader = 'assets/images/loader.svg';
    constructor(
        @Attribute('onErrorSrc') public onErrorSrc: string,
        private renderer: Renderer2,
        private el: ElementRef
    ) {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.loader);
    }

    @HostListener('load') 
    onLoad() {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.el.nativeElement.src);
    }

    @HostListener('error') 
    onError() {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.onErrorSrc);
    }
}
