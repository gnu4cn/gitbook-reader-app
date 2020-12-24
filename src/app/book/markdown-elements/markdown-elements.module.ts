import { NgModule, Injector, InjectionToken, Optional, ModuleWithProviders, Inject } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import visit from 'unist-util-visit';
import * as MDAST from 'mdast';
import * as UNIFIED from 'unified';

import { customSmartCodes } from '../shared/shortcodes';
import { MarkdownService } from '../markdown/markdown.service';
import { LocationService } from '../services/location.service';
import { isAbsolutePath } from '../shared/utils';
import { getBasePath } from '../shared/vfile';

// Custom Elements
import { MadeWithDocSPAComponent } from './made-with-love';
import { TOCComponent } from './toc';
import { EnvVarComponent } from './env-var.component';
import { TOCPaginationComponent } from './toc-pagination.component';
import { EmbedMarkdownComponent } from './embed-file';
import { TocService } from './toc.service';
import { MdLinkComponent } from './md-link';
import { SummaryComponent } from './summary';

export const MARKDOWNELEMENTS_CONFIG_TOKEN = new InjectionToken<any>( 'MarkdownElementsModule.forRoot() configuration.' );

const elements = [
    MadeWithDocSPAComponent,
    TOCComponent,
    EnvVarComponent,
    TOCPaginationComponent,
    EmbedMarkdownComponent,
    MdLinkComponent,
    SummaryComponent,
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule
    ],
    exports: [
        MadeWithDocSPAComponent,
        TOCComponent,
        EnvVarComponent,
        TOCPaginationComponent,
        EmbedMarkdownComponent,
        SummaryComponent,
        MdLinkComponent,
    ],
    declarations: [
        MadeWithDocSPAComponent,
        TOCComponent,
        EnvVarComponent,
        TOCPaginationComponent,
        EmbedMarkdownComponent,
        SummaryComponent,
        MdLinkComponent,
    ],
    bootstrap: [],
    entryComponents: [
        MadeWithDocSPAComponent,
        TOCComponent,
        EnvVarComponent,
        TOCPaginationComponent,
        EmbedMarkdownComponent,
        MdLinkComponent,
        SummaryComponent,
    ],
    providers: [
        TocService,
        { provide: MARKDOWNELEMENTS_CONFIG_TOKEN, useValue: elements },
    ]
})
export class MarkdownElementsModule {

    constructor(
        private injector: Injector,
        markdownService: MarkdownService,
        locationService: LocationService,
        @Optional() @Inject(MARKDOWNELEMENTS_CONFIG_TOKEN) _elements: any
    ) {
        if (_elements) {
            _elements.map((Constructor: any) => {
                if (Constructor.is) {
                    const content = createCustomElement(Constructor, { injector: this.injector });
                    customElements.define(Constructor.is, content, Constructor.options);
                }
            });

            const smartCodePaths = (): UNIFIED.Transformer => {
                return (tree: MDAST.Root, vfile: any) => {
                    vfile.data = vfile.data || {};
                    return visit(tree, 'shortcode', (node: any) => {
                        if (node.identifier === 'toc' || node.identifier === 'include') {

                            node.data = node.data || {};
                            node.data.hProperties = node.data.hProperties || {};
                            const path = node.data.originalPath = node.data.hProperties.path;

                            if (path === '' && node.identifier === 'toc') {
                                node.data.hProperties.path = vfile.data.base;
                            } else if (!isAbsolutePath(path)) {
                                node.data.hProperties.path = locationService.prepareLink(path, getBasePath(vfile));
                            }
                        }
                        return node;
                    });
                };
            };

            markdownService.remarkPlugins.push(smartCodePaths);

            // Adds a remarkplugin to short codes
            markdownService.remarkPlugins.push([customSmartCodes, {
                env: {
                    tagName: 'md-env'
                },
                toc: {
                    tagName: 'md-toc'
                },
                link: {
                    tagName: 'md-link'
                },
                summary: {
                    tagName: 'md-summary'
                },
                include: {
                    tagName: 'md-include'
                }
            }]);
        }
    }
}
