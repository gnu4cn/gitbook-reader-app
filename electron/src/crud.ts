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

    deleteItem = async (query: IQuery): Promise<IItem> => {
        switch(query.table){
            case 'Book':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Book)
                        .where("id = :id", { id: query.item.id })
                        .execute();
                } catch (err) {throw err};
                break;
            case 'Writer':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Writer)
                        .where("id = :id", { id: query.item.id })
                        .execute();
                } catch (err) {throw err};
                break;
            case 'Website':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Website)
                        .where("id = :id", { id: query.item.id })
                        .execute();
                } catch (err) {throw err};
                break;
            case 'Category':
                try {
                    await this.conn
                        .createQueryBuilder()
                        .delete()
                        .from(Category)
                        .where("id = :id", { id: query.item.id })
                        .execute();
                } catch (err) {throw err};
                break;
        }

        return query.item;
    }

    addItem = async (query: IQuery): Promise<IItem> => {
        let item: IItem;
        switch(query.table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    item = await bookRepo.create(query.item);
                    await bookRepo.save(item)
                } catch (err) {throw err};
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    item = await writerRepo.create(query.item);
                    await writerRepo.save(item)
                } catch (err) {throw err};
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    item = await websiteRepo.create(query.item);
                    await websiteRepo.save(item)
                } catch (err) {throw err};
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    item = await cateRepo.create(query.item);
                    await cateRepo.save(item)
                } catch (err) {throw err};
                break;
        }
        return item;
    }

    updateItem = async (query: IQuery): Promise<IItem> => {
        switch(query.table){
            case 'Book':
                try {
                    const bookRepo = this.conn.getRepository(Book);
                    await bookRepo.save(query.item);
                } catch (err) {throw err};
                break;
            case 'Writer':
                try {
                    const writerRepo = this.conn.getRepository(Writer);
                    await writerRepo.save(query.item)
                } catch (err) {throw err};
                break;
            case 'Website':
                try {
                    const websiteRepo = this.conn.getRepository(Website);
                    await websiteRepo.save(query.item)
                } catch (err) {throw err};
                break;
            case 'Category':
                try {
                    const cateRepo = this.conn.getRepository(Category);
                    await cateRepo.save(query.item)
                } catch (err) {throw err};
                break;
        }
        return query.item;
    }

    getItems = async(getParam: IFind) => {
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

        switch(getParam.table){
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
