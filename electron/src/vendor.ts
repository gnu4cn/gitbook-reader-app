interface unknowndata {
    [key: string]: unknown;
}

export interface IBookDownloading {
    _book: Book;
    percent: number;
}

export const asciiSpecialCharRegEx = new RegExp(/\.|\,|\:|\?|\;|\'|\"|\\|\/|\!|\@|\$|\%|\^|\&|\*|\(|\)|\#/, 'g');

// typeorm parts
import { Book, Writer, Category, Website } from './models';

export type TableName = "Book" | "Writer" | "Category" | "Website";
export const TableNames = ["Book", "Writer", "Category", "Website"];

export type IpcChannel = "get-items" | "add-item" | "delete-item" | "start-loading";
export const IpcChannels = [ "get-items", "add-item", "delete-item", "start-loading"];

export type ReplyChannel = "reply-get-items" | "reply-add-item" | "reply-delete-item" | "reply-start-loading";
export const ReplyChannels = [ "reply-get-items", "reply-add-item", "reply-delete-item", "reply-start-loading"];


export type ItemType = Book|Writer|Category|Website;

export interface IItem {
    table: TableName;
    item: Book|Writer|Category|Website;
}

export type FieldName = "books" | "writer" | "writers"| "categories" | "website";

export interface IFindCondition {
    field: FieldName;
    itemList: Array<ItemType>;
}

export interface IFind {
    table: TableName
    conditions?: Array<IFindCondition>;
}

export interface IWhereItem {
    field: FieldName;
    item: ItemType;
}

export interface IFindStatement {
    where: Array<IWhereItem> 
}
