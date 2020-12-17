import { ValidatorFn, AbstractControl } from '@angular/forms';

interface UnknownData {
    [key: string]: unknown;
}

interface IFilterWriter {
    writer: Writer
}

interface IFilterCate {
    cate: Category
}

interface IFilterWebsite {
    website: Website
}

export type IFilterItem = IFilterCate | IFilterWriter | IFilterWebsite

export interface IFilter {
    displayRecycled: boolean;
    filterList: Array<IFilterItem>
}

export interface IFilterAction {
    action: "add"|"remove";
    filterItem: IFilterCate | IFilterWriter | IFilterWebsite
}

export interface IQueryResult {
    message: Array<string|object>;
    data?: IItem | Array<IItem>
}

export interface IDeleteBookDialogData {
    book: Book;
}

export interface IDeleteBookDialogResData {
    recycled: boolean;
    remove: boolean;
    book: Book;
}

export interface NewBookDialogData {
    cateList: Category[];
    bookList: Array<Book>;
}

export interface NewBookDialogResData {
    bookUri: string;
    cateList: Array<Category>;
}

export interface IBookDownloading {
    book: Book;
    completed: number;
}

// typeorm parts
import { Book, Writer, Category, Website } from './models';

export type TableName = "Book" | "Writer" | "Category" | "Website";

export type IItem = Book|Writer|Category|Website;

export const Tables = ["Book", "Writer", "Category", "Website"];

export interface IQuery {
    table: TableName;
    item: Book|Writer|Category|Website;
}

export interface IQueryCondition {
    value: string|number;
}
export type FieldName = "id" | "name" | "desc"| "downloaded" | "recycled" | "cateList" | "writer" | "website";
export interface IFindCondition {
    field: FieldName;
    condition: IQueryCondition;
}

export interface IFind {
    table: TableName
    conditions?: IFindCondition;
}

export const REGEXP_ZH = new RegExp(/[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29\u{20000}-\u{2A6D6}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}]/u);

export const REGEXP_ABS_URL = new RegExp('^(?:[a-z]+:)?//', 'i');

export const REGEXP_SITE = new RegExp(/(([a-zA-Z0-9][a-zA-Z0-9\_\-]{0,252}\.){1,8})([a-zA-Z]{2,32})(\:([1-9][0-9]{1,3}|[1-5][0-9]{1,4}|6[1-4][0-9]{0,3}|65[0-4][0-9]{0,2}|655[1-2]?[0-9]?|6553[0-5]?))?/);
export const REGEXP_LOC = new RegExp(/[a-zA-Z0-9][a-zA-Z0-9\_\-]{1,31}\/[a-zA-Z0-9][a-zA-Z0-9\_\-]{1,31}/);

export const REGEXP_GIT_URI = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{0,252})\.){1,8}[a-zA-Z]{2,63})(\:([1-9][0-9]{1,3}|[1-5][0-9]{1,4}|6[1-4][0-9]{0,3}|65[0-4][0-9]{0,2}|655[1-2]?[0-9]?|6553[0-5]?))?\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{0,252})\.){1,8}[a-zA-Z]{2,63})(\:([1-9][0-9]{1,3}|[1-5][0-9]{1,4}|6[1-4][0-9]{0,3}|65[0-4][0-9]{0,2}|655[1-2]?[0-9]?|6553[0-5]?))?\:))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,254})(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,254})((\.git)?)$/);

export const asciiSpecialCharRegEx = new RegExp(/\.|\,|\:|\?|\;|\'|\"|\\|\/|\!|\@|\$|\%|\^|\&|\*|\(|\)|\#/, 'g');

export interface IMessage {
    event: string;
    data?: object | string;
}

export interface Location {
    path: string;
    title: string;
}

export const IsQualifiedAndNotExistedGitRepoValidatorFn = (bookList: Array<Book>): ValidatorFn => {
    return (control: AbstractControl): {[key: string]: any} | null => {
        const uri = (control.value || '').trim();;

        const isQuailified = REGEXP_GIT_URI.test(uri);
        if (!isQuailified){
            const errorMessage = {notQualifiedGitRepo: {value: uri}};
            return errorMessage;
        }

        let index: number = -1;
        if(isQuailified){
            index = bookList.findIndex(book => {
                const site = uri.match(REGEXP_SITE)[0];
                const loc = uri.replace(REGEXP_SITE, '').match(REGEXP_LOC)[0];

                const _site = book.website.uri;
                const _loc = `${book.writer.name}/${book.name}`

                const regex = new RegExp(site);

                if ( regex.test(_site) && loc === _loc ) return true;
            });
            if(index >= 0) {
                const errorMessage = {isExistedGitRepo: {value: uri}};
                return errorMessage;
            }
        }

        return null;
    };
}
