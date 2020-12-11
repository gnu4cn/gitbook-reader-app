import { Component, OnInit, Input, Inject, ElementRef, 
    ChangeDetectorRef,
    ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocomplete} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ElectronService } from 'ngx-electron';

import { Book, Category, Writer, Website } from '../../models';
import { CrudService } from '../../services/crud.service';

import { 
    IsQualifiedAndNotExistedGitRepoValidatorFn,
    IItem,
    REGEXP_ZH, REGEXP_SITE, REGEXP_LOC } from '../../vendor';

export interface NewBookDialogData {
    cateList: Category[];
    bookList: Array<Book>;
}

export interface NewBookDialogResData {
    bookUri: string;
    cateList: Array<Category>;
}

@Component({
    selector: 'app-book-list',
    templateUrl: './book-list.component.html',
    styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
    // full bookList
    bookList: Array<Book> = [];
    // bookList to display
    bookListDisplay: Array<Book> = [];
    writerList: Array<Writer> = [];
    cateList: Array<Category> = [];
    websiteList: Array<Website> = [];

    constructor(private dialog: MatDialog,
        private crud: CrudService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private electronService: ElectronService,
    ) {
    }

    ngOnInit() {
        this.initData();
        this.bookListDisplay = this.bookList.slice();

        this.electronService.ipcRenderer.on('new-downloading-progress', (ev, msg) => {
            const index = this.bookList.findIndex(b => b.id === msg._book.id);
            this.bookList.splice(index, 1);

            this.bookList.push(msg._book);
            this.bookListDisplay = this.bookList.slice();
            this.cdr.detectChanges();
        });
    }

    sortBy(list: Array<any>, prop: string){
        return list.sort((a, b) => a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1);
    }

    initData () {
        this.crud.getItems({table: 'Book'}).subscribe(res => {this.bookList = res.slice() as Book[];});
        this.crud.getItems({table: 'Writer'}).subscribe(res => {this.writerList = res.slice() as Writer[];});
        this.crud.getItems({table: 'Category'}).subscribe(res => {this.cateList = res.slice() as Category[];});
        this.crud.getItems({table: 'Website'}).subscribe(res => {this.websiteList = res.slice() as Website[];});
    }

    startDownload = (book: Book) => {
        this.electronService.ipcRenderer.send('download-book', book);
    }

    openBook(book: Book) {
        this.electronService.ipcRenderer.send('open-book', book)
    }

    queryCatName = () => {
        console.log('ion-label click test.')
    }

    removeCate = () => {
        console.log('ion-icon click test.')
    }

    openAddBookDialog = () => {
        const dialogRef = this.dialog.open(NewBookDialog, {
            width: '480px',
            data: { cateList: this.cateList, bookList: this.bookList}
        });

        dialogRef.afterClosed().subscribe(res => {
            this.saveBook(res);
        });
    }

    saveBook(res: NewBookDialogResData){
        const newBook = new Book();
        newBook.cateList = [];

        const newBookUri = res.bookUri;

        const site = newBookUri.match(REGEXP_SITE)[0];
        const [ writerName, name ] = newBookUri.replace(REGEXP_SITE, '').match(REGEXP_LOC)[0].split('/');
        newBook.name = name;

        const website = this.websiteList.find(w => w.uri === site);
        if (website){
            newBook.website = website;
        }
        else {
            const _website = new Website();
            _website.uri = site;

            const query: IItem = {
                table: "Website",
                item: _website
            }
            this.crud.addItem(query).subscribe(w => {
                const website = w as Website;
                newBook.website = website ;
                this.websiteList.push(website);
            });
        }

        const writer: Writer = this.writerList.find(w => w.name === writerName);
        if (writer){
            // 查看 website 是否在 writer 的
            if(writer.websiteList === undefined) writer.websiteList = [];
            const website = writer.websiteList.find(w => w.uri === newBook.website.uri);
            if(!website) {
                writer.websiteList.push(newBook.website);

                const query: IItem = {
                    table: 'Writer',
                    item: writer,
                }
                this.crud.updateItem(query).subscribe(w => {
                    newBook.writer = w as Writer;
                });
            }
            else newBook.writer = writer;
        }
        else {
            const _writer = new Writer();
            _writer.name = writerName;

            // 将 newBook.website 写入 _writer.websiteList
            _writer.websiteList = [];
            _writer.websiteList.push(newBook.website);

            const query: IItem = {
                table: "Writer",
                item: _writer
            }
            this.crud.addItem(query).subscribe(w => {
                const writer = w as Writer;
                newBook.writer = writer;
                this.writerList.push(writer);
            });
        }

        // 处理 cateList
        if(res.cateList.length>0){
            res.cateList.map(c => {
                const cate = this.cateList.find(cate => cate.name === c.name);
                if (cate) newBook.cateList.push(cate);
                else {
                    const _cate = new Category();
                    _cate.name = c.name;

                    const query: IItem = {
                        table: "Category",
                        item: _cate
                    }
                    this.crud.addItem(query).subscribe(c => {
                        const cate = c as Category;
                        this.cateList.push(cate);
                        newBook.cateList.push(cate);
                    });
                }
            });
        }

        // newBook 准备完毕，存入数据库
        const query: IItem = {
            table: 'Book',
            item: newBook
        }
        this.crud.addItem(query).subscribe(b => {
            this.bookList.push(b as Book);
            this.bookListDisplay = this.bookList.slice();
        });

    }
}

@Component({
    selector: 'app-new-book-dialog',
    templateUrl: 'new-book-dialog.html',
})
export class NewBookDialog implements OnInit{
    @ViewChild('cateInput') cateInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') MatAutocomplete: MatAutocomplete;

    uriInputControl: FormControl = new FormControl('');
    cateListInputControl: FormControl = new FormControl('');

    newBook: NewBookDialogResData = {
        bookUri: '',
        cateList: [],
    };

    visible = true;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ ENTER, COMMA, SPACE ];

    filteredCateList: Observable<Array<Category>>;
    _tempCateList = this.data.cateList.slice();

    constructor(
        public dialogRef: MatDialogRef<NewBookDialog>,
        @Inject(MAT_DIALOG_DATA) public data: NewBookDialogData
    ) {
        this.filteredCateList = this.cateListInputControl.valueChanges.pipe(
            startWith(null),
            map((cateInput: string | null) => cateInput ? this._filter(cateInput) : this._tempCateList.slice())
        );

        this.uriInputControl.valueChanges.subscribe(val => this.newBook.bookUri = val);
    }

    ngOnInit() {
        this.uriInputControl.setValidators(IsQualifiedAndNotExistedGitRepoValidatorFn(this.data.bookList));
    }

    private _filter(val: string): Array<Category> {
        const zh = REGEXP_ZH.test(val);

        if(zh){
            return this._tempCateList.filter(cate => cate.name.indexOf(val) === 0 );
        }
        else{
            const filterVal = val.toLowerCase();
            return this._tempCateList.filter(cate => cate.name.toLowerCase().indexOf(filterVal) === 0);
        }
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        this._add(value);

        if(input) {
            input.value = '';
        }

        this.cateListInputControl.setValue(null);
    }

    _add(value: string){
        const _value = (value || '').trim();

        if(_value) {
            // 加入到 newBook 的 cateList
            const _cate = this.data.cateList.find(cate => cate.name === _value);

            if(_cate){
                this.newBook.cateList.push(_cate);
            }
            else {
                const cate = new Category();
                cate.name = _value;
                this.newBook.cateList.push(cate);
            }

            // 从备选清单中移除
            const _cateIndex = this._tempCateList.findIndex(cate => cate.name === _value);
            if(_cateIndex>=0) this._tempCateList.splice(_cateIndex, 1);
        }
    }

    remove(cate: Category): void {
        // 从 newBook 的 cateList 中移除
        const index = this.newBook.cateList.findIndex(c => c.name === cate.name);
        this.newBook.cateList.splice(index, 1);

        // 重新加入到备选清单
        const _cate = this.data.cateList.find(c => c.name === cate.name);
        if(_cate) this._tempCateList.push(_cate);
    }

    selected(event: MatAutocompleteSelectedEvent): void{
        const value = event.option.viewValue;

        this._add(value);

        this.cateInput.nativeElement.value = '';
        this.cateListInputControl.setValue(null);
    }

    getErrorMsg(){
        if(this.uriInputControl.hasError('required')){
            return '需要提供 Git repo 地址';
        }

        if(this.uriInputControl.hasError('notQualifiedGitRepo')){
            return '所提供的地址不是合格的Git repo地址';
        }

        if(this.uriInputControl.hasError('isExistedGitRepo')){
            return '所提供的地址已经存在';
        }
    }

    get bookUriInput(){
        return this.uriInputControl.value;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
