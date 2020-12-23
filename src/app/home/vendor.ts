import { Book, Category } from '../models';
import { IFilter } from '../vendor';

export interface IAddBookDialogResData {
    bookUri: string;
    cateList: Array<Category>;
}

export type TOpMessage = Array<string|object>;

export interface IDeleteBookDialogResData {
    recycled: boolean;
    remove: boolean;
    book: Book;
}

export type TAvatarIds = "currently-reading" | "on-shelf" | "recycled";

export type TBookSortBy = "name" | "openCount" | "dateCreated" | "dateUpdated";

// 尚待优化
export const filterFn = (book: Book, filter: IFilter): boolean => {
    // 当只显示 回收站 里的书时
    if(filter.displayRecycled) return book.recycled;

    // 当显示正在看的书时 
    if(filter.isOpened){ return book.openCount > 0;}
    else {
        // 显示书架上的书
        return !book.recycled && book.openCount === 0;
    }

    let _writer: boolean = false;
    let _website: boolean = false;
    let _cate: boolean = false;
    let _openCount: boolean = false;

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
