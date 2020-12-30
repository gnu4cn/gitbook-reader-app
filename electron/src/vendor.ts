// typeorm parts
import { Book, Category, Writer, Website, Record } from './models';

interface unknowndata {
    [key: string]: unknown;
}

export interface IBookWithPath {
    book: Book;
    path: string
}

export interface IReadingProgress {
    url: string;
    title: string;
    sections: Array<string>;
    bookCommit: string
}

export interface IProgressMessage {
    book: Book;
    progress: number
}

export interface IBookDownloaded {
    commit: string;
    branch: string;
}

export interface IError {
    message: string;
    err: object
}

export interface IIpcMessage {
    title: string;
    data: number|IBookDownloaded|IError
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

export const asciiSpecialCharRegEx = new RegExp(/\.|\,|\:|\?|\;|\'|\"|\\|\/|\!|\@|\$|\%|\^|\&|\*|\(|\)|\#/, 'g');

export type TTableName = "Book" | "Writer" | "Category" | "Website" | "Record";

export type IItem = Book|Writer|Category|Website|Record;

export interface IQuery {
    table: TTableName;
    item: IItem;
}

export interface IQueryResult {
    message: Array<string|object>;
    data?: IItem | Array<IItem>
}

export type FieldName = "id" | "name" | "desc"| "downloaded" | "recycled" | "cateList" | "writer" | "website" | "commit";
export interface IFindCondition {
    field: FieldName;
    value: string|number|IItem
}

export interface IFind {
    table: TTableName
    condition?: IFindCondition;
}
