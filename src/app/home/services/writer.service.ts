import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Book, Writer, Website } from '../../models';

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

    newWriter = async (writerName: string, newBook: Book, platformName?: string) => {
        const writer = await this.list.find(w => w.name === writerName);

        if (writer){
            // 查看 website 是否在 writer 的
            if(writer.websiteList === undefined) writer.websiteList = [];

            const index = await writer.websiteList.findIndex(w => w.uri === newBook.website.uri);
            if(index < 0) {
                writer.websiteList.push(newBook.website);

                const query: IQuery = {
                    table: 'Writer',
                    item: writer,
                }

                const res: IQueryResult = await this.crud.updateItem(query).toPromise();
                this.opMessage.newMsg(res.message);

                const w = res.data as Writer;
                this.list.push(w);
                return w;
            }
            else return writer;
        }
        else {
            const _writer = new Writer();
            _writer.name = writerName;

            // 将 newBook.website 写入 _writer.websiteList
            _writer.websiteList = [];
            _writer.websiteList.push(newBook.website);

            // 获取writer的更多信息
            let rawWriter: object = {};
            if(/gitlab/.test(newBook.website.uri)){
                const rawWriterList = await this.fetchService.getWriterProfile(writerName, newBook.website.uri);
                rawWriter = rawWriterList[0];
            }

            if(newBook.isFromMainstreamPlatform && !(/gitlab/.test(newBook.website.uri))){
                rawWriter = await this.fetchService.getWriterProfile(platformName 
                    ? platformName 
                    : writerName, newBook.website.uri);
            }

            if(newBook.isFromMainstreamPlatform) {
                _writer.platformId =  rawWriter['id'] as number;
                _writer.avatarUrl = rawWriter['avatar_url'];
                _writer.fullName = rawWriter['name'] ? rawWriter['name'] : '';
                _writer.htmlUrl = rawWriter['html_url'];
                _writer.desc = rawWriter['bio'] ? rawWriter['bio'] : '';
            }

            if(/github/.test(newBook.website.uri)) _writer.location = rawWriter['location'] 
                ? rawWriter['location'] 
                : '';

            const query: IQuery = {
                table: "Writer",
                item: _writer
            }

            const res: IQueryResult = await this.crud.addItem(query).toPromise();

            this.opMessage.newMsg(res.message);
            const w = res.data as Writer;
            this.list.push(w);
            return w;
        }
    }
}
