import { ConnectionManager, Connection } from 'typeorm';

import { Book, Category, Writer, Website } from './models';

import { 
    TableName, 
    IFind,
    IItem, 
    IWhereItem,
    IQuery,
    IFindStatement,
    IFindCondition, 
    IQueryResult,
} from './vendor';

export class CRUD {
    conn: Connection;

    constructor () {
        const connectionManager = new ConnectionManager();
        this.conn = connectionManager.create({
            type: 'sqlite',
            synchronize: true,
            logging: false,
            logger: 'simple-console',
            database: './db.sqlite',
            entities: [ Category, Website, Writer, Book ],
        });
        
        this.conn.connect();
    }

    updateCCNA60D = async () => {
        const bookRepo = this.conn.getRepository(Book);
        const b = await bookRepo
            .createQueryBuilder('book')
            .where("book.name = :name", {name: 'ccna60d'})
            .getOne();

        if(b) {
            b.downloaded = 100;
            await bookRepo.save(b);
        }
    }

    deleteItem = async (query: IQuery): Promise<IQueryResult> => {
        let message: Array<string|object> = [];
        switch(query.table){
            case 'Book':
                try {
                    const book = query.item as Book;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Book)
                        .where("id = :id", { id: book.id })
                        .execute();
                    message.push(`书籍 ${book.name} 成功从数据库移除`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Writer':
                try {
                    const writer = query.item as Writer;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Writer)
                        .where("id = :id", { id: writer.id })
                        .execute();

                    message.push(`作者 ${writer.name} 成功从数据库移除`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Website':
                try {
                    const website = query.item as Website;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Website)
                        .where("id = :id", { id: website.id })
                        .execute();

                    message.push(`托管平台 ${website.uri} 成功从数据库移除`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Category':
                try {
                    const cate = query.item as Category;
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Category)
                        .where("id = :id", { id: cate.id })
                        .execute();

                    message.push(`类别 ${cate.name} 成功从数据库移除`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
        }

       return {message: message}
    }

    addItem = async (query: IQuery): Promise<IQueryResult> => {
        let item: IItem;
        let message: Array<string|object> = [];
        switch(query.table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    item = await bookRepo.create(query.item);
                    await bookRepo.save(item)

                    message.push(`书籍 ${item.name} 成功添加`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    item = await writerRepo.create(query.item);
                    await writerRepo.save(item)

                    message.push(`作者 ${item.name} 成功添加`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    item = await websiteRepo.create(query.item);
                    await websiteRepo.save(item)

                    message.push(`托管平台 ${item.uri} 成功添加`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    item = await cateRepo.create(query.item);
                    await cateRepo.save(item)

                    message.push(`类别 ${item.name} 成功添加`);
                } catch (err) {
                    message.push(err);
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
        let message: Array<string|object> = [];
        switch(query.table){
            case 'Book':
                try {
                    const book = query.item as Book;
                    const bookRepo = this.conn.getRepository(Book);
                    await bookRepo.save(book);

                    message.push(`书籍 ${book.name} 已成功更新`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Writer':
                try {
                    const writer = query.item as Writer;
                    const writerRepo = this.conn.getRepository(Writer);
                    await writerRepo.save(writer);

                    message.push(`作者 ${writer.name} 已成功更新`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Website':
                try {
                    const website = query.item as Website;
                    const websiteRepo = this.conn.getRepository(Website);
                    await websiteRepo.save(website);

                    message.push(`托管平台 ${website.uri} 已成功更新`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
            case 'Category':
                try {
                    const cate = query.item as Category;
                    const cateRepo = this.conn.getRepository(Category);
                    await cateRepo.save(cate);

                    message.push(`类别 ${cate.name} 已成功更新`);
                } catch (err) {
                    message.push(err);
                    throw err
                };
                break;
        }
        return {message: message, data: query.item};
    }

    getItems = async(getParam: IFind): Promise<IQueryResult> => {
        let findStatement: IFindStatement;
        let itemList: Array<IItem>;
        let message: Array<string|object> = [];

        if(getParam.conditions) {
            const conditions = getParam.conditions as Array<IFindCondition>; 

            conditions.map(c => {
                const field = c.field;
                const list = c.itemList;

                list.map(i => {
                    const condition: IWhereItem = {
                        field: field,
                        item: i
                    };
                    findStatement.where.push(condition)
                })
            });
        }

        switch(getParam.table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    if(findStatement) {
                        itemList = await bookRepo.find(findStatement);
                    }
                    else {
                        itemList = await this.conn
                            .getRepository(Book)
                            .createQueryBuilder('book')
                            .leftJoinAndSelect('book.writer', 'writer')
                            .leftJoinAndSelect('book.website', 'website')
                            .leftJoinAndSelect('book.cateList', 'cateList')
                            .getMany();
                    }

                    message.push(`获取到 ${itemList.length} 本书籍`);
                } catch (err){ 
                    message.push(err);
                    throw err; 
                }
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    if(findStatement) { 
                        itemList = await writerRepo.find(findStatement);
                    }
                    else {
                        itemList = await this.conn
                            .getRepository(Writer)
                            .createQueryBuilder('writer')
                            .leftJoinAndSelect('writer.websiteList', 'websiteList')
                            .getMany();
                    }
                    
                    message.push(`获取到 ${itemList.length} 名作者`);
                } catch (err){ 
                    message.push(err);
                    throw err; 
                }
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    if(findStatement) itemList = await cateRepo.find(findStatement);
                    else itemList = await cateRepo.find();

                    message.push(`获取到 ${itemList.length} 个类别`);
                } catch (err){ 
                    message.push(err);
                    throw err; 
                }
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    if(findStatement) itemList = await websiteRepo.find(findStatement);
                    else itemList = await websiteRepo.find();

                    message.push(`获取到 ${itemList.length} 个托管平台`);
                } catch (err){ 
                    message.push(err);
                    throw err; 
                }
                break;
        }

        return {message: message, data: itemList}
    }
}
