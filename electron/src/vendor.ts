// typeorm parts
import { Book, Category, Writer, Website } from './models';

interface unknowndata {
    [key: string]: unknown;
}

export interface IBookDownloaded {
    desc: string;
    commit: string;
}

export interface IIpcMessage {
    title: string;
    data: number|IBookDownloaded|Error;
}

export const sortFn = (a: string, b: string) => {
    const regex = new RegExp(/[0-9][0-9]?[0-9]?/)
    const testA = a.match(regex);
    const testB = b.match(regex);
    const aN: number = testA ? parseInt(testA[0]) : 0;
    const bN: number = testB ? parseInt(testB[0]) : 0;

    return aN-bN;
}


export function join(start: string, end: string): string {
  if (start.length === 0) {
    return end;
  }
  if (end.length === 0) {
    return start;
  }
  let slashes = 0;
  if (start.endsWith('/')) {
    slashes++;
  }
  if (end.startsWith('/')) {
    slashes++;
  }
  if (slashes === 2) {
    return start + end.substring(1);
  }
  if (slashes === 1) {
    return start + end;
  }
  return start + '/' + end;
}

export interface IBookDownloading {
    _book: Book;
    percent: number;
}

export const asciiSpecialCharRegEx = new RegExp(/\.|\,|\:|\?|\;|\'|\"|\\|\/|\!|\@|\$|\%|\^|\&|\*|\(|\)|\#/, 'g');



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
