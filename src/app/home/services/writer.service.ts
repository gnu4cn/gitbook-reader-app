import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Writer, Website } from '../../models';

import { OpMessageService } from './op-message.service';
import { 
    IQuery,
    IQueryResult,
} from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class WriterService {
    private _writerList: Array<Writer>

        constructor(
            private crud: CrudService,
            private opMessage: OpMessageService,
        ) { 
            this.crud.getItems({table: 'Writer'})
                .subscribe((res: IQueryResult) => {
                    this.opMessage.newMsg(res.message);
                    const writers = res.data as Writer[];
                    this._writerList = writers.slice();
                });
        }


    newWriter = (writerName: string, website: Website) => {
        const writer = this._writerList.find(w => w.name === writerName);
        if (writer){
            // 查看 website 是否在 writer 的
            if(writer.websiteList === undefined) writer.websiteList = [];
            const index = writer.websiteList.findIndex(w => w.uri === website.uri);
            if(index < 0) {
                writer.websiteList.push(website);

                const query: IQuery = {
                    table: 'Writer',
                    item: writer,
                }
                this.crud.updateItem(query).subscribe((res: IQueryResult) => {
                    this.opMessage.newMsg(res.message);
                    return res.data as Writer;
                });
            }
            else return writer;
        }
        else {
            const _writer = new Writer();
            _writer.name = writerName;

            // 将 newBook.website 写入 _writer.websiteList
            _writer.websiteList = [];
            _writer.websiteList.push(website);

            const query: IQuery = {
                table: "Writer",
                item: _writer
            }
            this.crud.addItem(query).subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);

                const writer = res.data as Writer;
                this._writerList.push(writer);
                return writer;
            });
        }
    }
}
