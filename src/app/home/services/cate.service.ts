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
    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
    ) {
    }

    getList = async () => {
        let list: Array<Category>;

        await this.crud.getItems({table: 'Category'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const cates = res.data as Category[];
                list = cates.slice();
            });

        return list;
    }

    saveList = async (cateList: Array<Category>) => {
        const tempList: Array<Category> = [];
        const list = await this.getList();

        await cateList.map(c => {
            const cate = list.find(cate => cate.name === c.name);
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
