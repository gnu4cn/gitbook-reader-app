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
    list: Array<Category>;

    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
    ) {
        this.crud.getItems({table: 'Category'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const cates = res.data as Category[];
                this.list = cates.slice();
            });
    }

    saveList = async (cateList: Array<Category>) => {
        const tempList: Array<Category> = [];

        await cateList.map(c => {
            const cate = this.list.find(cate => cate.name === c.name);

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
