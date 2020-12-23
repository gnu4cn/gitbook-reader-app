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
    private _websiteList: Array<Website>;

    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
    ) {
        this.crud.getItems({table: 'Website'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const websites = res.data as Website[];
                this._websiteList = websites.slice();
            });
    }

    newWebsit = (uri: string) => {
        const website = this._websiteList.find(w => w.uri === uri);
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
            this.crud.addItem(query).subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);

                const website = res.data as Website;
                this._websiteList.push(website);
                return website;
            });
        }
    }
}
