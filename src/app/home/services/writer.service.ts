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
    constructor(
        private crud: CrudService,
        private opMessage: OpMessageService,
    ) {}

    getList = async () => {
        let list: Array<Writer>;

        await this.crud.getItems({table: 'Writer'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const writers = res.data as Writer[];
                list = writers.slice();
            });

        return list;
    }

    newWriter = async (writerName: string, website: Website) => {
        const list = await this.getList();

        const writer = list.find(w => w.name === writerName);
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

                let w: Writer;
                await this.crud.updateItem(query).subscribe((res: IQueryResult) => {
                    this.opMessage.newMsg(res.message);
                    w = res.data as Writer;
                });

                return w;
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

            let w: Writer;
            await this.crud.addItem(query).subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);

                w = res.data as Writer;
            });

            return w;
        }
    }
}
