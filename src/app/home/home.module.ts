import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MaterialModule } from '../material.module';

import { BookListComponent } from './components/book-list.component';
import { NewBookDialog } from './components/new-book-dialog.component';
import { DeleteBookDialog } from './components/delete-book-dialog.component';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        MaterialModule,
        HomePageRoutingModule
    ],
    declarations: [HomePage,
        BookListComponent,
        NewBookDialog,
        DeleteBookDialog,
    ]
})
export class HomePageModule {}
