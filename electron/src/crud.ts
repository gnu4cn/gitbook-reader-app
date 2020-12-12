import { ConnectionManager } from 'typeorm';

import { Book, Writer, Category, Website } from './models';

import { TableName, 
    IpcChannel, 
    IFind,
    ItemType, 
    IWhereItem,
    IItem,
    IFindStatement,
    IFindCondition, } from './vendor';

const connectionManager = new ConnectionManager();

export const conn = connectionManager.create({
    type: 'sqlite',
    synchronize: true,
    logging: true,
    logger: 'simple-console',
    database: './db.sqlite',
    entities: [ Category, Website, Writer, Book ],
});

const updateCCNA60D = async () => {
    if (!conn.isConnected) await conn.connect();
    const bookRepo = conn.getRepository(Book);
    const b = await bookRepo
        .createQueryBuilder('book')
        .where("book.name = :name", {name: 'ccna60d'})
        .getOne();

    if(b) {
        b.downloaded = 100;
        await bookRepo.save(b);
    }
}


export const addItem = async (_item: IItem): Promise<ItemType> => {
    if (!conn.isConnected) await conn.connect();

    const table = _item.table;
    const item = _item.item;

    switch(table){
        case 'Book':
            try {
                const bookRepo = conn.getRepository(Book);
                const _item = await bookRepo.create(item);
                await bookRepo.save(_item)
                return _item;
            } catch (err) {throw err};
            break;
        case 'Writer':
            try {
                const writerRepo = conn.getRepository(Writer);
                const _item = await writerRepo.create(item);
                await writerRepo.save(_item)
                return _item;
            } catch (err) {throw err};
            break;
        case 'Website':
            try {
                const websiteRepo = conn.getRepository(Website);
                const _item = await websiteRepo.create(item);
                await websiteRepo.save(_item)
                return _item;
            } catch (err) {throw err};
            break;
        case 'Category':
            try {
                const cateRepo = conn.getRepository(Category);
                const _item = await cateRepo.create(item);
                await cateRepo.save(_item)
                return _item;
            } catch (err) {throw err};
            break;
    };

}


export const updateItem = async (_item: IItem): Promise<ItemType> => {
    if (!conn.isConnected) await conn.connect();

    const table = _item.table;
    const item = _item.item;

    switch(table){
        case 'Book':
            try {
                const bookRepo = conn.getRepository(Book);
                await bookRepo.save(item);
                return item;
            } catch (err) {throw err};
            break;
        case 'Writer':
            try {
                const writerRepo = conn.getRepository(Writer);
                await writerRepo.save(item)
                return item;
            } catch (err) {throw err};
            break;
        case 'Website':
            try {
                const websiteRepo = conn.getRepository(Website);
                await websiteRepo.save(item)
                return item;
            } catch (err) {throw err};
            break;
        case 'Category':
            try {
                const cateRepo = conn.getRepository(Category);
                await cateRepo.save(item)
                return item;
            } catch (err) {throw err};
            break;
    };

    return item;
}

export const getItems = async(getParam: IFind) => {
    if (!conn.isConnected) await conn.connect();

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
                const bookRepo = conn.getRepository(Book);
                if(findStatement) {
                    return await bookRepo.find(findStatement);
                }
                else {
                    return await conn
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
                const writerRepo = conn.getRepository(Writer);
                if(findStatement) { 
                    return await writerRepo.find(findStatement);
                }
                else {
                    return await conn
                        .getRepository(Writer)
                        .createQueryBuilder('writer')
                        .leftJoinAndSelect('writer.websiteList', 'websiteList')
                        .getMany();
                }
            } catch (err){ throw err; }
            break;
        case 'Category':
            try {
                const cateRepo = conn.getRepository(Category);
                if(findStatement) return await cateRepo.find(findStatement);
                else return await cateRepo.find();
            } catch (err){ throw err; }
            break;
        case 'Website':
            try {
                const websiteRepo = conn.getRepository(Website);
                if(findStatement) return await websiteRepo.find(findStatement);
                else return await websiteRepo.find();
            } catch (err){ throw err; }
            break;
    };
}
