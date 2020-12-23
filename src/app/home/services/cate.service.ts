import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Category } from '../../models';

import { OpMessageService } from './op-message.service';
import { 
    IQuery,
    IQueryResult,
} from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class CateService {
    private _list: Array<Category>;

    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
    ) {
        this.crud.getItems({table: 'Category'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const cates = res.data as Category[];
                this._list = cates.slice();
            });
    }

    get list () {
        return this._list;
    }

    saveList = (cateList: Array<Category>) => {
        const tempList: Array<Category> = [];
        cateList.map(c => {
            const cate = this._list.find(cate => cate.name === c.name);
            if (cate) tempList.push(cate);
            else {
                const _cate = new Category();
                _cate.name = c.name;

                const query: IQuery = {
                    table: "Category",
                    item: _cate
                }
                this.crud.addItem(query).subscribe((res: IQueryResult) => {
                    this.opMessage.newMsg(res.message);

                    const cate = res.data as Category;
                    tempList.push(cate);
                });
            }
        });

        return tempList;
    }
}
