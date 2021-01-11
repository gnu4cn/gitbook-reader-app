import { NgModule, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

// For DocSPA
import { MarkdownElementsModule } from './markdown-elements/markdown-elements.module';
import { MarkdownModule } from './markdown/markdown.module';
import { DocsifyPluginsModule } from './docsify-plugins.module';
import { I18nModule } from '../i18n/i18n.module';

import { MARKDOWN_CONFIG_TOKEN } from './markdown/markdown.service';

import { SettingsService } from './services/settings.service';
import { RouterService } from './services/router.service';
import { LocationService } from './services/location.service';
import { FetchService } from './services/fetch.service';
import { HooksService } from './services/hooks.service';
import { PrintService } from './services/print.service';
import { MessageService } from '../services/message.service';
import { SearchService } from './services/search.service';

import { SectionScrollSpyDirective } from './directives/section-spy.directive';
import { ListCollapseDirective } from './directives/list-collapse.directive';
import { ElementInputDirective } from './directives/element-input.directive';

import { createCustomElement } from '@angular/elements';

import { preset } from '../gbr-preset';
// import { DocspaStackblitzModule } from '@swimlane/docspa-stackblitz';
// import * as squeezeParagraphs from 'remark-squeeze-paragraphs';

import { EditOnGithubComponent } from './plugins/edit-on-github';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

import { GBR_CONFIG_TOKEN, GBR_ENVIRONMENT } from './gbr.tokens';
import { ContentSearchDirective } from './directives/content-search.directive';

import { environment } from '../../environments/environment';
import { config } from '../gbr.config';
import { UiImageLoaderDirective } from './directives/ui-image-loader.directive';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        I18nModule,
        HttpClientModule,
        MarkdownModule,
        MarkdownElementsModule,
        DocsifyPluginsModule,
    ],
    declarations: [
        EditOnGithubComponent,
        ListCollapseDirective,
        SectionScrollSpyDirective,
        ElementInputDirective,
        ContentSearchDirective,
        SafeHtmlPipe,
        UiImageLoaderDirective,
    ],
    providers: [
        SettingsService,
        HooksService,
        FetchService,
        RouterService,
        PrintService,
        MessageService,
        SearchService,
        LocationService,
        { provide: GBR_ENVIRONMENT, useValue: environment },
        { provide: GBR_CONFIG_TOKEN, useValue: config },
        { provide: MARKDOWN_CONFIG_TOKEN, useValue: preset },
    ],
    entryComponents: [
        EditOnGithubComponent,
    ],
    exports: [
        MarkdownModule,
        MarkdownElementsModule,
        DocsifyPluginsModule,
        EditOnGithubComponent,
        ListCollapseDirective,
        SectionScrollSpyDirective,
        ElementInputDirective,
        SafeHtmlPipe,
        ContentSearchDirective,
        UiImageLoaderDirective,
    ]
})
export class BookPageModule {
    constructor(private injector: Injector) {
        const content = createCustomElement(EditOnGithubComponent, { injector: this.injector });
        customElements.define(EditOnGithubComponent.is, content);
    }
}
