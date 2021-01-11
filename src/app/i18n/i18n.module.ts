import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { I18nService } from './i18n.service';
import { createTranslateHttpLoader } from '../vendor';
@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateHttpLoader),
                deps: [HttpClient]
            }
        }),
    ],
    exports: [
        TranslateModule,
    ],
    providers: [
        I18nService
    ]
})
export class I18nModule { }
