import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

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
    ]
})
export class I18nModule { }
