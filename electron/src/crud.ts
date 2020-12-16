import { ConnectionManager, Connection } from 'typeorm';

import { Book, Category, Writer, Website } from './models';

import { 
    TableName, 
    IFind,
    ItemType, 
    IWhereItem,
    IItem,
    IFindStatement,
    IFindCondition, 
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

    deleteItem = async (_item: IItem): Promise<ItemType> => {
        const table = _item.table;
        const item = _item.item;

        switch(table){
            case 'Book':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Book)
                        .where("id = :id", { id: item.id })
                        .execute();
                    return item;
                } catch (err) {throw err};
                break;
            case 'Writer':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Writer)
                        .where("id = :id", { id: item.id })
                        .execute();
                    return item;

                } catch (err) {throw err};
                break;
            case 'Website':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Website)
                        .where("id = :id", { id: item.id })
                        .execute();
                    return item;

                } catch (err) {throw err};
                break;
            case 'Category':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Category)
                        .where("id = :id", { id: item.id })
                        .execute();
                    return item;

                } catch (err) {throw err};
                break;
        };
    }

    addItem = async (_item: IItem): Promise<ItemType> => {
        const table = _item.table;
        const item = _item.item;

        switch(table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    const _item = await bookRepo.create(item);
                    await bookRepo.save(_item)
                    return _item;
                } catch (err) {throw err};
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    const _item = await writerRepo.create(item);
                    await writerRepo.save(_item)
                    return _item;
                } catch (err) {throw err};
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    const _item = await websiteRepo.create(item);
                    await websiteRepo.save(_item)
                    return _item;
                } catch (err) {throw err};
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    const _item = await cateRepo.create(item);
                    await cateRepo.save(_item)
                    return _item;
                } catch (err) {throw err};
                break;
        };

    }

    updateItem = async (_item: IItem): Promise<ItemType> => {
        const table = _item.table;
        const item = _item.item;

        switch(table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    await bookRepo.save(item);
                    return item;
                } catch (err) {throw err};
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    await writerRepo.save(item)
                    return item;
                } catch (err) {throw err};
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    await websiteRepo.save(item)
                    return item;
                } catch (err) {throw err};
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    await cateRepo.save(item)
                    return item;
                } catch (err) {throw err};
                break;
        };

        return item;
    }

    getItems = async(getParam: IFind) => {
        const table: TableName = getParam.table as TableName;

        let findStatement: IFindStatement;

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

        switch(table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    if(findStatement) {
                        return await bookRepo.find(findStatement);
                    }
                    else {
                        return await this.conn
                            .getRepository(Book)
                            .createQueryBuilder('book')
                            .leftJoinAndSelect('book.writer', 'writer')
                            .leftJoinAndSelect('book.website', 'website')
                            .leftJoinAndSelect('book.cateList', 'cateList')
                            .getMany();
                    }
                } catch (err){ throw err; }
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    if(findStatement) { 
                        return await writerRepo.find(findStatement);
                    }
                    else {
                        return await this.conn
                            .getRepository(Writer)
                            .createQueryBuilder('writer')
                            .leftJoinAndSelect('writer.websiteList', 'websiteList')
                            .getMany();
                    }
                } catch (err){ throw err; }
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    if(findStatement) return await cateRepo.find(findStatement);
                    else return await cateRepo.find();
                } catch (err){ throw err; }
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    if(findStatement) return await websiteRepo.find(findStatement);
                    else return await websiteRepo.find();
                } catch (err){ throw err; }
                break;
        };
    }
}
