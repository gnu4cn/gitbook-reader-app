import { Book, Category, Writer, Website, Record } from './models';
import { ValidatorFn, AbstractControl } from '@angular/forms';

import {
    differenceInYears,
    differenceInMonths,
    differenceInWeeks,
    differenceInDays,
    differenceInHours,
    differenceInMinutes
} from 'date-fns';

// typeorm parts
export const sortBy = (list: Array<any>, prop: string, subProp?: string) => {
    return subProp ? list.sort((a, b) => a[prop][subProp] > b[prop][subProp] ? -1 : a[prop][subProp] === b[prop][subProp] ? 0 : 1) 
        : list.sort((a, b) => a[prop] > b[prop] ? -1 : a[prop] === b[prop] ? 0 : 1);
}

export const getReadableDate = (date: Date): string => {
    const now = new Date();
    const years = differenceInYears(now, date);
    const months = differenceInMonths(now, date);
    const weeks = differenceInWeeks(now, date);
    const days = differenceInDays(now, date);
    const hours = differenceInHours(now, date);
    const minutes = differenceInMinutes(now, date);

    if(years > 0) return `${years} 年前`;
    if(months > 0) return `${months} 个月前`;
    if(weeks > 0) return `${weeks} 周前`;
    if(days > 0) return `${days} 天前`;
    if(hours > 0) return `${hours} 小时前`;
    return `${minutes} 分钟前`;
}


export interface ICloudBook {
    fullName: string;
    url: string;
    desc: string;
    writerName: string;
    writerAvatarUrl: string;
    dateUpdated: Date;
    stars: number
}

export interface IBookWithPath {
    book: Book;
    path: string
}

export interface IProgressMessage {
    book: Book;
    progress: number
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
    beenOpened?: boolean;
    filterList?: Array<IFilterItem>
}

export interface IFilterAction {
    action: "add"|"remove";
    filterItem: IFilterCate | IFilterWriter | IFilterWebsite
}

export type TTableName = "Book" | "Writer" | "Category" | "Website" | "Record";

export type IItem = Book|Writer|Category|Website|Record;

export interface IQuery {
    table: TTableName;
    item: IItem;
}

export interface IQueryResult {
    message: TOpMessage;
    data?: IItem | Array<IItem>;
}

export interface IReadingProgress {
    url: string;
    title: string;
    sections: Array<string>;
    bookCommit: string
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

export const REGEXP_ZH = new RegExp(/[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29\u{20000}-\u{2A6D6}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}]/u);

export const REGEXP_ABS_URL = new RegExp('^(?:[a-z]+:)?//', 'i');

export const REGEXP_SITE = new RegExp(/(([a-zA-Z0-9][a-zA-Z0-9\_\-]{0,252}\.){1,8})([a-zA-Z]{2,32})(\:([1-9][0-9]{1,3}|[1-5][0-9]{1,4}|6[1-4][0-9]{0,3}|65[0-4][0-9]{0,2}|655[1-2]?[0-9]?|6553[0-5]?))?/);
export const REGEXP_LOC = new RegExp(/[a-zA-Z0-9][a-zA-Z0-9\_\-\.]{1,253}[a-zA-Z0-9]\/[a-zA-Z0-9][a-zA-Z0-9\_\-\.]{1,253}[a-zA-Z0-9]/);

export const REGEXP_GIT_URI = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{0,252})\.){1,8}[a-zA-Z]{2,63})(\:([1-9][0-9]{1,3}|[1-5][0-9]{1,4}|6[1-4][0-9]{0,3}|65[0-4][0-9]{0,2}|655[1-2]?[0-9]?|6553[0-5]?))?\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{0,252})\.){1,8}[a-zA-Z]{2,63})(\:([1-9][0-9]{1,3}|[1-5][0-9]{1,4}|6[1-4][0-9]{0,3}|65[0-4][0-9]{0,2}|655[1-2]?[0-9]?|6553[0-5]?))?\:))([a-zA-Z0-9][a-zA-Z0-9\_\-\.]{1,253}[a-zA-Z0-9])(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-\.]{1,253}[a-zA-Z0-9])((\.git)?)$/);

export const asciiSpecialCharRegEx = new RegExp(/\.|\,|\:|\?|\;|\'|\"|\\|\/|\!|\@|\$|\%|\^|\&|\*|\(|\)|\#/, 'g');

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
                let loc: string = uri.replace(REGEXP_SITE, '').match(REGEXP_LOC)[0];

                const re = new RegExp(/\.git$/);
                loc = re.test(loc) ? loc.replace(re, '') : loc;

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

export interface IAddBookDialogResData {
    bookUri: string;
    cateList: Array<Category>;
}

export type TOpMessage = Array<string>;

export interface IDeleteBookDialogResData {
    recycled: boolean;
    remove: boolean;
    book: Book;
}

export type TAvatarIds = "currently-reading" | "on-shelf" | "recycled" | "cloud-search";

export type TBookSortBy = "name" | "recordList:length" | "dateCreated" | "dateUpdated";

// 尚待优化
export const filterFn = (book: Book, filter: IFilter): boolean => {
    // 当只显示 回收站 里的书时
    if(filter.displayRecycled) return book.recycled;

    // 当显示正在看的书时 
    if(filter.beenOpened){ 
        return (book.recordList ? book.recordList.length>0 : false) && !book.recycled; 
    }
    else {
        // 显示书架上的书
        return !book.recycled && (book.recordList ? book.recordList.length === 0 : true);
    }

    if(filter.filterList.length > 0){
        let _writer: boolean = false;
        let _website: boolean = false;
        let _cate: boolean = false;

        filter.filterList.forEach(filterItem => {
            const key = Object.keys(filterItem)[0];

            switch(key){
                case 'writer':
                    if(book.writer.id === filterItem[key].id) {
                        _writer = true;
                    }
                    break
                case 'website':
                    if(book.website.id === filterItem[key].id) {
                        _website = true;
                    }
                    break
                case 'cate':
                    const index = book.cateList.findIndex(cate => cate.id === filterItem[key].id);
                    if(index >= 0) {
                        _cate = true;
                    }
                    break
            }
        });

        return _writer || _website || _cate;
    }

    return true;
}
export interface IMessage {
    event: string;
    data?: object | string;
}

export const join = (start: string, end: string): string => {
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


