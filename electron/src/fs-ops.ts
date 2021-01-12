import { extname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import { moveSync } from 'fs-extra';

import { 
    sortFn 
} from './vendor';

export const getMdList = (bookDir: string): Array<string> => {
    const list = lookupMdFiles(bookDir).reduce((acc: Array<string>, i: string): Array<string> => {
        return i ? [...acc, i.replace(bookDir, '')] : acc;
    }, []);

    return list.sort(sortFn);
}

export const lookupMdFiles = (dir: string): Array<string> => {
    const fileList = readdirSync(dir);

    return fileList.reduce((acc: Array<string>, f: string): Array<string> => {
        const fPath = join(dir, f);

        const isDir = statSync(fPath).isDirectory();
        const regex = new RegExp(/^(\.|\_|sidebar)/);

        if (isDir && !regex.test(f)) {
            return acc.concat(lookupMdFiles(fPath));
        };

        const ext = extname(f);
        const isMd = ext.toLowerCase() === '.md';
        const isSummary = f.toLowerCase() === 'summary.md';
        const condition = !isDir && isMd && !isSummary && !regex.test(f);

        return condition? [...acc, fPath] : acc;

    }, []) as Array<string>;
}
