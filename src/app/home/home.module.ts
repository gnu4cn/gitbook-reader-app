import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MatPaginatorIntl } from '@angular/material/paginator';
import { MaterialModule } from '../material.module';
import { MglTimelineModule } from 'angular-mgl-timeline';

import { I18nModule } from '../i18n/i18n.module';
import { BookListComponent } from './components/book-list.component';
import { NewBookDialog } from './components/new-book-dialog.component';
import { DeleteBookDialog } from './components/delete-book-dialog.component';
import { SnackbarComponent } from './components/snackbar.component';
import { EditBookCateListDialog } from './components/edit-book-cate-list.component';
import { ReadingRecordDialog } from './components/reading-record-dialog.component';
import { SearchComponent } from './components/search.component';

import { BookService } from './services/book.service';
import { WebsiteService } from './services/website.service';
import { CateService } from './services/cate.service';
import { WriterService } from './services/writer.service';
import { OpMessageService } from './services/op-message.service';
import { FetchService } from './services/fetch.service';
import { PrivateTokensService } from './services/private-tokens.service';
import { MatPaginatorIntlHans } from '../vendor';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { ReadableDatePipe } from './pipes/readable-date.pipe';
import { StringToDatePipe } from './pipes/string-to-date.pipe';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        I18nModule,
        MglTimelineModule,
        MaterialModule,
        HomePageRoutingModule
    ],
    declarations: [HomePage,
        BookListComponent,
        NewBookDialog,
        DeleteBookDialog,
        EditBookCateListDialog,
        ReadingRecordDialog,
        SnackbarComponent,
        SearchComponent,
        ReadableDatePipe,
        StringToDatePipe,
    ],
    providers: [
        BookService,
        WriterService,
        WebsiteService,
        CateService,
        OpMessageService,
        PrivateTokensService,
        ReadableDatePipe,
        StringToDatePipe,
        FetchService,
        { provide: MatPaginatorIntl, useClass: MatPaginatorIntlHans}
    ]
})
export class HomePageModule {}
