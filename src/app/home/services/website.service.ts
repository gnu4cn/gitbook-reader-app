import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Website } from '../../models';

import { OpMessageService } from './op-message.service';
import { 
    IQuery,
    IQueryResult,
} from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class WebsiteService {
    list: Array<Website>;

    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
    ) {
        this.crud.getItems({table: 'Website'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const websites = res.data as Website[];
                this.list = websites.slice();
            });
    }

    newWebsit = async (uri: string) => {
        const website = await this.list.find(w => w.uri === uri);

        if (website){
            return website;
        }
        else {
            const _website = new Website();
            _website.uri = uri;

            const query: IQuery = {
                table: "Website",
                item: _website
            }

            const res:IQueryResult = await this.crud.addItem(query).toPromise();
            this.opMessage.newMsg(res.message);

            const w = res.data as Website;
            this.list.push(w);

            return w;
        }
    }
}
