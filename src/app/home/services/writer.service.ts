import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Writer, Website } from '../../models';

import { OpMessageService } from './op-message.service';
import { FetchService } from './fetch.service';

import { 
    IQuery,
    IQueryResult,
} from '../../vendor';

@Injectable({
    providedIn: 'root'
})
export class WriterService {
    list: Array<Writer>;

    constructor(
        private crud: CrudService,
        private fetchService: FetchService,
        private opMessage: OpMessageService,
    ) {
        this.crud.getItems({table: 'Writer'})
            .subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);
                const writers = res.data as Writer[];
                this.list = writers.slice();
            });
    }

    newWriter = async (writerName: string, website: Website, platformName?: string) => {
        const writer = await this.list.find(w => w.name === writerName);

        if (writer){
            // 查看 website 是否在 writer 的
            if(writer.websiteList === undefined) writer.websiteList = [];

            const index = await writer.websiteList.findIndex(w => w.uri === website.uri);
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
                    this.list.push(w);
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

            // 获取writer的更多信息
            await this.fetchService.getWriterProfile(platformName ? platformName : writerName, website.uri).subscribe(res => {
                console.log(res);

                _writer.platformId = res['id'];
                _writer.avatar_url = res['avatar_url'];
                _writer.fullName = res['name'];
                _writer.htmlUrl = res['html_url'];
                _writer.desc = res['bio'];
                if(/github/.test(website.uri))_writer.location = res['location'];
            });

            const query: IQuery = {
                table: "Writer",
                item: _writer
            }

            let w: Writer;
            await this.crud.addItem(query).subscribe((res: IQueryResult) => {
                this.opMessage.newMsg(res.message);

                w = res.data as Writer;
                this.list.push(w);
            });

            return w;
        }
    }
}
