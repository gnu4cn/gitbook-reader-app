import { ConnectionManager, Connection } from 'typeorm';

import { Book, Category, Writer, Website, Record } from './models';
import { join } from 'path';

import { 
    TTableName, 
    IFind,
    IItem, 
    IQuery,
    IQueryResult,
} from './vendor';

export class CRUD {
    conn: Connection;

    constructor (appDir: string) {
        const connectionManager = new ConnectionManager();
        this.conn = connectionManager.create({
            type: 'sqlite',
            synchronize: true,
            logging: false,
            logger: 'simple-console',
            database: join(appDir, 'db.sqlite'),
            entities: [ Category, Website, Writer, Book, Record ],
        });

        this.conn.connect();
    }

    getItem = async (query: IFind): Promise<IQueryResult> => {
        const field = query.condition.field;
        const value = query.condition.value;
        let item: IItem;
        let repo: any;
        let message: Array<string> = [];
        switch(query.table){
            case 'Book':
                try {
                    repo = this.conn.getRepository(Book);
                    item = await repo
                        .createQueryBuilder('b')
                        .where(`b.${field} = :value`, {value: value})
                        .leftJoinAndSelect('b.writer', 'writer', 'writer.id = b.writerId')
                        .leftJoinAndSelect('b.website', 'website', 'website.id = b.websiteId')
                        .leftJoinAndSelect('b.cateList', 'cateList')
                        .leftJoinAndSelect('b.recordList', 'recordList')
                        .getOne();

                    message.push('成功获取到书籍')
                } catch (err) {
                    message.push(err.message);
                    throw err
                }

                break
            case 'Writer':
                try {
                    repo = this.conn.getRepository(Writer);
                    item = await repo
                        .createQueryBuilder('w')
                        .where(`w.${field} = :value`, {value: value})
                        .leftJoinAndSelect('w.bookList', 'bookList')
                        .leftJoinAndSelect('w.websiteList', 'websiteList')
                        .getOne();

                    message.push('成功获取到作者')
                } catch (err) {
                    message.push(err.message);
                    throw err
                }
                break
            case 'Website':
                try{
                    repo = this.conn.getRepository(Website);
                    item = await repo
                        .createQueryBuilder('w')
                        .where(`w.${field} = :value`, {value: value})
                        .leftJoinAndSelect('w.bookList', 'bookList')
                        .leftJoinAndSelect('w.writerList', 'writerList')
                        .getOne();

                    message.push('成功获取到托管平台')
                } catch (err) {
                    message.push(err.message);
                    throw err
                }

                break
            case 'Category':
                try{
                    repo = this.conn.getRepository(Category);
                    item = await repo
                        .createQueryBuilder('c')
                        .where(`c.${field} = :value`, {value: value})
                        .leftJoinAndSelect('c.bookList', 'bookList')
                        .getOne();

                    message.push('成功获取到类别')
                } catch (err) {
                    message.push(err.message);
                    throw err
                }
                break
        }

        return { message: message, data: item }
    }

    deleteItem = async (query: IQuery): Promise<IQueryResult> => {
        let item: IItem;
        let message: Array<string> = [];
        switch(query.table){
            case 'Book':
                try {
                    item = query.item as Book;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Book)
                        .where("id = :id", { id: item.id })
                        .execute();
                    message.push(`书籍 ${item.name} 成功从数据库移除`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Writer':
                try {
                    item = query.item as Writer;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Writer)
                        .where("id = :id", { id: item.id })
                        .execute();

                    message.push(`作者 ${item.name} 成功从数据库移除`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Website':
                try {
                    item = query.item as Website;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Website)
                        .where("id = :id", { id: item.id })
                        .execute();

                    message.push(`托管平台 ${item.uri} 成功从数据库移除`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Category':
                try {
                    item = query.item as Category;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Category)
                        .where("id = :id", { id: item.id })
                        .execute();

                    message.push(`类别 ${item.name} 成功从数据库移除`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Record':
                try {
                    item = query.item as Book;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Record)
                        .where("bookId = :id", { id: item.id })
                        .execute();

                    message.push(`${item.name} 的阅读记录成功从数据库移除`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
        }

        return {message: message}
    }

    addItem = async (query: IQuery): Promise<IQueryResult> => {
        let item: IItem;
        let repo: any;
        let message: Array<string> = [];
        switch(query.table){
            case 'Book':
                try {
                    repo = this.conn.getRepository(Book);
                    item = await repo.create(query.item) as Book;
                    await repo.save(item)

                    message.push(`书籍 ${item.name} 成功添加`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Writer':
                try {
                    repo = this.conn.getRepository(Writer);
                    item = await repo.create(query.item) as Writer;
                    await repo.save(item)

                    message.push(`作者 ${item.name} 成功添加`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Website':
                try {
                    repo = this.conn.getRepository(Website);
                    item = await repo.create(query.item) as Website;
                    await repo.save(item)

                    message.push(`托管平台 ${item.uri} 成功添加`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Category':
                try {
                    repo = this.conn.getRepository(Category);
                    item = await repo.create(query.item) as Category;
                    await repo.save(item)

                    message.push(`类别 ${item.name} 成功添加`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Record':
                try {
                    repo = this.conn.getRepository(Record);
                    item = await repo.create(query.item);
                    await repo.save(item)

                    message.push(`阅读记录 ${item.desc} 成功添加`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
        }
        return {
            message: message,
            data: item
        };
    }

    updateItem = async (query: IQuery): Promise<IQueryResult> => {
        let message: Array<string> = [];
        let repo: any;
        switch(query.table){
            case 'Book':
                try {
                    const book = query.item as Book;
                    repo = this.conn.getRepository(Book);
                    await repo.save(book);

                    message.push(`书籍 ${book.name} 已成功更新`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Writer':
                try {
                    const writer = query.item as Writer;
                    repo = this.conn.getRepository(Writer);
                    await repo.save(writer);

                    message.push(`作者 ${writer.name} 已成功更新`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Website':
                try {
                    const website = query.item as Website;
                    repo = this.conn.getRepository(Website);
                    await repo.save(website);

                    message.push(`托管平台 ${website.uri} 已成功更新`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
            case 'Category':
                try {
                    const cate = query.item as Category;
                    repo = this.conn.getRepository(Category);
                    await repo.save(cate);

                    message.push(`类别 ${cate.name} 已成功更新`);
                } catch (err) {
                    message.push(err.message);
                    throw err
                };
                break;
        }
        return {message: message, data: query.item};
    }

    getItems = async(getParam: IFind): Promise<IQueryResult> => {
        let itemList: Array<IItem>;
        let repo: any;
        let message: Array<string> = [];

        switch(getParam.table){
            case 'Book':
                try {
                    repo = this.conn.getRepository(Book);
                    itemList = await repo
                        .createQueryBuilder('b')
                        .leftJoinAndSelect('b.writer', 'writer', 'writer.id = b.writerId')
                        .leftJoinAndSelect('b.website', 'website', 'website.id = b.websiteId')
                        .leftJoinAndSelect('b.cateList', 'cateList')
                        .leftJoinAndSelect('b.recordList', 'recordList')
                        .getMany();

                    message.push(`获取到 ${itemList.length} 本书籍`);
                } catch (err){ 
                    message.push(err.message);
                    throw err; 
                }
                break;
            case 'Writer':
                try {
                    repo = this.conn.getRepository(Writer);
                    itemList = await repo
                        .createQueryBuilder('w')
                        .leftJoinAndSelect('w.websiteList', 'websiteList')
                        .leftJoinAndSelect('w.bookList', 'bookList')
                        .getMany();

                    message.push(`获取到 ${itemList.length} 名作者`);
                } catch (err){ 
                    message.push(err.message);
                    throw err; 
                }
                break;
            case 'Category':
                try {
                    repo = this.conn.getRepository(Category);
                    itemList = await repo
                        .createQueryBuilder('c')
                        .leftJoinAndSelect('c.bookList', 'bookList')
                        .getMany();

                    message.push(`获取到 ${itemList.length} 个类别`);
                } catch (err){ 
                    message.push(err.message);
                    throw err; 
                }
                break;
            case 'Website':
                try {
                    repo = this.conn.getRepository(Website);
                    itemList = await repo
                        .createQueryBuilder('w')
                        .leftJoinAndSelect('w.writerList', 'writerList')
                        .leftJoinAndSelect('w.bookList', 'bookList')
                        .getMany();

                    message.push(`获取到 ${itemList.length} 个托管平台`);
                } catch (err){ 
                    message.push(err.message);
                    throw err; 
                }
                break;
        }

        return {message: message, data: itemList}
    }
}
