import { NgModule, ModuleWithProviders } from '@angular/core';
import { MarkdownService, MARKDOWN_CONFIG_TOKEN } from './markdown.service';

@NgModule({
    declarations: [],
    bootstrap: [],
    entryComponents: [],
    providers: [
        MarkdownService,
        { provide: MARKDOWN_CONFIG_TOKEN, useValue: {} },
    ]
})
export class MarkdownModule {}
