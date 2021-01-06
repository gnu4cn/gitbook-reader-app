import { Component, OnInit, Input } from '@angular/core';

import { ICloudBook } from '../../vendor';
@Component({
    selector: 'app-books-cloud-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
    @Input() bookList: Array<ICloudBook>;
    @Input() searching: boolean;

    constructor() {}

    ngOnInit() {}
}
