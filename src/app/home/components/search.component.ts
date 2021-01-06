import { Component, OnInit } from '@angular/core';

import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';

import { FetchService } from '../services/fetch.service';
import { MessageService } from '../../services/message.service';

import { 
    ICloudBook,
    IMessage
} from '../../vendor';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

@Component({
    selector: 'app-books-cloud-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
    keywordsFormControl = new FormControl('', [
        Validators.required
    ]);

    bookList: Array<ICloudBook> = [];

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

    matcher = new MyErrorStateMatcher();
    keywords: string = '';
    platformSelected: string = 'github.com';
    bookListCount: number;

    constructor(
        private fetchService: FetchService,
        private message: MessageService
    ) { }

    ngOnInit() {
        this.message.getMessage().subscribe(async (msg: IMessage) => {
            if(msg.event === 'scrolled-to-end'){
                if(this.bookList.length%20 === 0 && !(/gitlab/.test(this.platformSelected))){
                    this.search(this.bookList.length/20 + 1);
                }
            }
        });
    }

    clearKeywords = () => {
        this.keywords = '';
    }
    /*
     *
     * @page, 传入 1 表示首次搜索，需要清空原有 bookList 
     */
    search = async (page: number) => {
        const res = await this.fetchService.searchBooks(this.platformSelected, this.keywords, page) as object[] | object;

        let _bookList: object[]
        if(/github/.test(this.platformSelected)){
            _bookList = res['items'].slice();
            this.bookListCount = res['total_count'];
        } else {
            _bookList = (res as object[]).slice();
        }

        if(page === 1) this.bookList = [].slice();
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

            this.bookList.push(book);
        });
    }
}
