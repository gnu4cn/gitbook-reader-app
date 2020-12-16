import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookPageModule } from '../book/book.module';

import { ReadPageRoutingModule } from './read-routing.module';
import { ReadPage } from './read.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        BookPageModule,
        ReadPageRoutingModule
    ],
    declarations: [ReadPage]
})
export class ReadPageModule {}
