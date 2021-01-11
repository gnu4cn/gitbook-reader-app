import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { MatPaginatorIntl } from '@angular/material/paginator';
import { MaterialModule } from '../material.module';
import { MglTimelineModule } from 'angular-mgl-timeline';

import { BookPageModule } from '../book/book.module';
import { BookListComponent } from './components/book-list.component';
import { NewBookDialog } from './components/new-book-dialog.component';
import { DeleteBookDialog } from './components/delete-book-dialog.component';
import { SnackbarComponent } from './components/snackbar.component';
import { EditBookCateListDialog } from './components/edit-book-cate-list.component';
import { ReadmeDialog } from './components/readme-dialog.component';
import { ReadingRecordDialog } from './components/reading-record-dialog.component';
import { SearchComponent } from './components/search.component';

import { BookService } from './services/book.service';
import { WebsiteService } from './services/website.service';
import { CateService } from './services/cate.service';
import { WriterService } from './services/writer.service';
import { OpMessageService } from './services/op-message.service';
import { FetchService } from './services/fetch.service';
import { PrivateTokensService } from './services/private-tokens.service';
import { MatPaginatorIntlHans, createTranslateHttpLoader } from '../vendor';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        BookPageModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateHttpLoader),
                deps: [HttpClient]
            }
        }),
        MglTimelineModule,
        MaterialModule,
        HomePageRoutingModule
    ],
    declarations: [HomePage,
        BookListComponent,
        NewBookDialog,
        DeleteBookDialog,
        EditBookCateListDialog,
        ReadmeDialog,
        ReadingRecordDialog,
        SnackbarComponent,
        SearchComponent
    ],
    providers: [
        BookService,
        WriterService,
        WebsiteService,
        CateService,
        OpMessageService,
        PrivateTokensService,
        FetchService,
        { provide: MatPaginatorIntl, useClass: MatPaginatorIntlHans}
    ]
})
export class HomePageModule {}
