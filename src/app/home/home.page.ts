import { Component, 
    ChangeDetectorRef,
    OnInit,
    AfterViewInit
} from '@angular/core';

import { 
    MatDialog, 
} from '@angular/material/dialog';

import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';

import { FetchService } from './services/fetch.service';

import {
    MatSnackBar,
    MatSnackBarRef,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import { CrudService } from '../services/crud.service';

import { Book } from '../models';
import { BookService } from './services/book.service';
import { OpMessageService } from './services/op-message.service';
import {MessageService} from '../services/message.service';

import { SnackbarComponent } from './components/snackbar.component';
import { NewBookDialog } from './components/new-book-dialog.component';

import { 
    IProgressMessage,
    IAddBookDialogResData,
    ICloudBook,
    ISearchHistory,
    IFilter,
    filterFn,
    sortBy,
    getReadableDate,
    IMessage,
    IQueryResult,
    TAvatarIds, 
    TBookSortBy,
} from '../vendor';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
    horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    verticalPosition: MatSnackBarVerticalPosition = 'bottom';
    keywordsFormControl = new FormControl('', [
        Validators.required
    ]);

    downloadingList: Array<number> = [];

    sortBy: TBookSortBy = 'recordList:length';
    displayRecycled: boolean = false;
    beenOpened: boolean = true;
    bookList: Array<Book>;
    search: boolean = false;
    matcher = new MyErrorStateMatcher();
    keywords: string = '';
    platformSelected: string = 'github.com';
    bookListCloud: Array<ICloudBook> = [];
    searching: boolean = false;
    searchEnd: boolean = false;
    private _searchHistory: Array<ISearchHistory> = [];

    platforms = [{
        name: 'github.com',
        icon: 'assets/images/github-favicon.svg',
    },{
        name: 'gitee.com',
        icon: 'assets/images/logo_gitee_g_red.svg',
    },{
        name: 'gitlab.com',
        icon: 'assets/images/gitlab-seeklogo.com.svg',
    }];

    constructor(
        private crud: CrudService,
        private snackbar: MatSnackBar,
        private dialog: MatDialog,
        private opMessage: OpMessageService,
        private message: MessageService,
        private fetchService: FetchService,
        private cdr: ChangeDetectorRef,
        private book: BookService,
    ) {
        this.bookList = book.list;
    }

    get searchHistory () {
        return sortBy(this._searchHistory, 'date'); 
    }

    private changeFabButton = (button: TAvatarIds) => {
        const buttonList = ['currently-reading', 'on-shelf', 'recycled', 'cloud-search'];
        document.getElementById(`avatar-${button}`)
            .style.backgroundColor = '#3880ff';

        const index = buttonList.findIndex(b => b === button);
        buttonList.splice(index, 1);

        buttonList.map(b => {
            document.getElementById(`avatar-${b}`)
                .style.backgroundColor = "#fff";
        });
    } 

    get currentlyReading () {
        const filter: IFilter = {
            displayRecycled: false,
            beenOpened: true,
        }
        return this.bookList.filter(b => filterFn(b, filter)).length;
    }

    get onShelf () {
        const filter = {
            displayRecycled: false,
            beenOpened: false,
        }
        return this.bookList.filter(b => filterFn(b, filter)).length;
    }

    get recycled () {
        const filter = {
            displayRecycled: true,
        }
        return this.bookList.filter(b => filterFn(b, filter)).length;
    }

    ngOnInit() {
        const histories = localStorage.getItem('searchHistory');

        if(histories){
            histories.split('|').map(history => {
                const _history = history.split('::');

                this._searchHistory.push({
                    keywords: _history[0],
                    platform: _history[1],
                    date: new Date(_history[2])
                })
            });
        }

        this.crud.ipcRenderer.on('book-updated', (ev, msg: IQueryResult) => {
            this.opMessage.newMsg(msg.message);
            this.book.listUpdated(msg.data as Book);

        });

        this.message.getMessage().subscribe((_: IMessage) => {
            if(_.event === 'book-list-updated') this.bookList = (_.data as Book[]).slice();

            this.cdr.detectChanges();
        });

        this.crud.ipcRenderer.on('error-occured', (ev, book: Book) => {
            this.book.listUpdated(book);
        });

        this.crud.ipcRenderer.on('new-downloading-progress', (ev, msg: IProgressMessage) => {
            // 当前没有下载任务
            if(this.downloadingList.length === 0){
                this.snackbar.openFromComponent(SnackbarComponent, {
                    duration: 0,
                    data: msg,
                    horizontalPosition: this.horizontalPosition,
                    verticalPosition: this.verticalPosition,
                });
            }

            const index = this.downloadingList.findIndex(id => id === msg.book.id);
            if(index < 0){
                this.downloadingList.push(msg.book.id);
            }

            this.cdr.detectChanges();
        });

        this.crud.ipcRenderer.on('book-downloaded', (ev, msg: IProgressMessage) => {
            const index = this.downloadingList.findIndex(id => id === msg.book.id);
            this.downloadingList.splice(index, 1);

            this.book.listUpdated(msg.book);

            if(this.downloadingList.length === 0){
                this.snackbar.dismiss();
            }
        });
    }

    ngAfterViewInit(){
        this.changeFabButton('currently-reading');
    }

    displayBookListCurrentlyReading = () => {
        this.search = false;
        this.bookListCloud = [].slice();

        this.displayRecycled = false;
        this.beenOpened = true;
        this.sortBy = 'recordList:length';

        this.changeFabButton('currently-reading');
    }

    displayBookListOnShelf = () => {
        this.search = false;
        this.bookListCloud = [].slice();

        this.displayRecycled = false;
        this.beenOpened = false;
        this.sortBy = 'dateCreated';

        this.changeFabButton('on-shelf');
    }

    displayBookListRecycled = () => {
        this.search = false;
        this.bookListCloud = [].slice();

        this.displayRecycled = true;
        this.sortBy = 'dateUpdated';

        this.changeFabButton('recycled');
    }

    openSearchPage = () => {
        this.search = true;
        this.changeFabButton('cloud-search');
    }

    openAddBookDialog = () => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
        });

        dialogRef.afterClosed().subscribe((res: IAddBookDialogResData) => {
            if(res) this.book.save(res);
        });
    }

    onScroll = async ($event) => {
        if(!this.search || this.searchEnd){return;}

        if($event.target.localName !== 'ion-content') { return; }

        const scrollElement = await $event.target.getScrollElement();
        const scrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;

        const currentScrollDepth = $event.detail.scrollTop;

        if(currentScrollDepth === scrollHeight){
            if(
                this.bookListCloud.length%20 === 0 
                && !(/gitlab/.test(this.platformSelected))
            ){
                this.cloudSearch(this.bookListCloud.length/20 + 1);
            }
        }
    }

    historySearch = (keywords: string, platform: string) => {
        this.keywords = keywords;
        this.platformSelected = platform;

        this.cloudSearch(1, true);
    }

    cloudSearch = async (page: number, fromHistory?: boolean) => {
        if(page === 1) {
            this.searchEnd = false;
            this.bookListCloud = [].slice();

            if(!fromHistory) {
                if(this._searchHistory.length === 20) {
                    this._searchHistory.splice(0,1);
                }
                this._searchHistory.push({
                    keywords: this.keywords,
                    platform: this.platformSelected,
                    date: new Date()
                });

                const historyStr = this._searchHistory.reduce((acc: string, history: ISearchHistory): string => {
                    return history 
                        ? acc.concat(`${history.keywords}::${history.platform}::${history.date.toString()}|`) 
                        : acc;
                }, '');

                localStorage.setItem('searchHistory', historyStr.replace(/\|$/, ''));
            }
        };

        this.searching = true;

        const res = await this.fetchService
            .searchBooks(this.platformSelected, this.keywords, page) as object[] | object;

        if((res as object[]).length === 0){
            this.searchEnd = true;
            return;
        }

        this.searching = false;

        let _bookList: object[]
        if(/github/.test(this.platformSelected)){
            _bookList = res['items'].slice();
        } else {
            _bookList = (res as object[]).slice();
        }

        _bookList.map((bookRaw: object) => {
            const book: ICloudBook = {
                fullName: '',
                url: '',
                desc: '',
                writerName: '',
                writerAvatarUrl: '',
                dateUpdated: new Date(),
                stars: 0
            };

            book.desc = bookRaw['description'] ? bookRaw['description'] : '';

            if(/gitlab/.test(this.platformSelected)){
                book.dateUpdated = bookRaw['last_activity_at'];
                book.writerName = bookRaw['namespace']['name'];
                book.writerAvatarUrl = bookRaw['namespace']['avatar_url'];
                book.url = bookRaw['http_url_to_repo'];
                book.stars = bookRaw['star_count'];
                book.fullName = bookRaw['path_with_namespace'];
            }
            if(!(/gitlab/.test(this.platformSelected))){
                book.dateUpdated = bookRaw['updated_at'];
                book.writerName = /github/.test(this.platformSelected) ? bookRaw['owner']['login'] : bookRaw['owner']['name'];
                book.writerAvatarUrl = bookRaw['owner']['avatar_url'];
                book.url = /github/.test(this.platformSelected) ? bookRaw['clone_url'] : bookRaw['html_url'];
                book.stars = bookRaw['stargazers_count'];
                book.fullName = bookRaw['full_name'];
            }

            this.bookListCloud.push(book);
        });
    }

    clearKeywords = () => {
        this.keywords = '';
    }

    readableDate = (date: Date) => {
        return getReadableDate(date);
    }
}
