import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { I18nModule } from '../i18n/i18n.module';
import { BookPageModule } from '../book/book.module';

import { ReadPageRoutingModule } from './read-routing.module';
import { ReadPage } from './read.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        I18nModule,
        BookPageModule,
        ReadPageRoutingModule
    ],
    declarations: [ReadPage]
})
export class ReadPageModule {}
