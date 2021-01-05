import { Component, OnInit } from '@angular/core';

import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';

import { FetchService } from '../services/fetch.service';

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
    ])

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

    keywords: string = '';
    platformSelected: string = 'github.com';

    constructor(
        private fetchService: FetchService
    ) { }

    ngOnInit() {}

    search = async () => {
        const res = await this.fetchService.searchBooks(this.platformSelected, this.keywords, 1);

        console.log(res);
    }

    matcher = new MyErrorStateMatcher();
}
