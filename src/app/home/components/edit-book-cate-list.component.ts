import { 
    Component, 
    OnInit, 
    Inject, 
    ElementRef, 
    ViewChild 
} from '@angular/core';
import { FormControl } from '@angular/forms';
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
    Book,
} from '../../models';

import { REGEXP_ZH, IEditBookDialogData } from '../../vendor';

@Component({
    selector: 'edit-book-cate-list-dialog',
    templateUrl: 'edit-book-cate-list.html',
})
export class EditBookCateListDialog implements OnInit{
    @ViewChild('cateInput') cateInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') MatAutocomplete: MatAutocomplete;

    cateListInputControl: FormControl = new FormControl('');

    visible = true;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ENTER, COMMA];

    filteredCateList: Observable<Category[]>;
    tempCateList: Array<Category>;

    constructor(
        public dialogRef: MatDialogRef<EditBookCateListDialog>,
        @Inject(MAT_DIALOG_DATA) public data: IEditBookDialogData 
    ) {
        this.filteredCateList = this.cateListInputControl.valueChanges.pipe(
            startWith(null),
            map((cateInput: string | null) => cateInput ? this._filter(cateInput) : this.tempCateList.slice())
        );
    }

    ngOnInit() {
        // 生成备选清单，要把 this.data.book 的 cateList 移除
        this.tempCateList = this.data.cateList.slice();

        this.data.book.cateList.map(c => {
            const index = this.tempCateList.findIndex(_c => _c.id === c.id);
            this.tempCateList.splice(index, 1);
        });
    }

    private _filter(val: string): Array<Category> {
        const zh = REGEXP_ZH.test(val);

        if(zh){
            return this.tempCateList.filter(cate => cate.name.indexOf(val) === 0 );
        }
        else{
            const filterVal = val.toLowerCase();
            return this.tempCateList.filter(cate => cate.name.toLowerCase().indexOf(filterVal) === 0);
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
                this.data.book.cateList.push(_cate);
            }
            else {
                const cate = new Category();
                cate.name = _value;
                this.data.book.cateList.push(cate);
            }

            // 从备选清单中移除
            const _cateIndex = this.tempCateList.findIndex(cate => cate.name === _value);
            if(_cateIndex>=0) this.tempCateList.splice(_cateIndex, 1);
        }
    }

    remove(cate: Category): void {
        // 从 newBook 的 cateList 中移除
        const index = this.data.book.cateList.findIndex(c => c.name === cate.name);
        this.data.book.cateList.splice(index, 1);

        // 如果在既有类别清单中，则重新加入到备选清单
        const _cate = this.data.cateList.find(c => c.name === cate.name);
        if(_cate) this.tempCateList.push(_cate);
    }

    selected(event: MatAutocompleteSelectedEvent): void{
        const value = event.option.viewValue;

        this._add(value);

        this.cateInput.nativeElement.value = '';
        this.cateListInputControl.setValue(null);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
