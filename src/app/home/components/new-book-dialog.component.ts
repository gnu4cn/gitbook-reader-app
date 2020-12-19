import { 
    Component, 
    OnInit, 
    Inject, 
    ElementRef, 
    ViewChild 
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { 
    MatDialogRef, 
    MAT_DIALOG_DATA 
} from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent, MatAutocomplete} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';

import { 
    Category, 
} from '../../models';
import { 
    NewBookDialogResData, 
    NewBookDialogData,
    IsQualifiedAndNotExistedGitRepoValidatorFn,
    REGEXP_ZH,
} from '../../vendor';

@Component({
    selector: 'app-new-book-dialog',
    templateUrl: 'new-book-dialog.component.html',
})
export class NewBookDialog implements OnInit{
    @ViewChild('cateInput') cateInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') MatAutocomplete: MatAutocomplete;

    uriInputControl: FormControl = new FormControl();
    cateListInputControl: FormControl = new FormControl();

    newBook: NewBookDialogResData = {
        bookUri: '',
        cateList: [],
    };

    visible = true;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ ENTER, COMMA ];


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
