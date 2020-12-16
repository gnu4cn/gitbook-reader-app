import { extname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import { moveSync } from 'fs-extra';

import { asciiSpecialCharRegEx, sortFn } from './vendor';

export const getMdList = (bookDir: string): Array<string> => {
    const list = lookupMdFiles(bookDir).reduce((acc: Array<string>, i: string): Array<string> => {
        return i ? [...acc, i.replace(bookDir, '')] : acc;
    }, []);

    return list.sort(sortFn);
}

export const escapeFileNames = async (dir: string) => {
    const fileList = readdirSync(dir);

    await fileList.map(async (f) => {
        const fPath = join(dir, f);
        const isDir = statSync(fPath).isDirectory();

        if (isDir && (f !== '.git')) {
            if(asciiSpecialCharRegEx.test(f)) {
                const _f = f.replace(asciiSpecialCharRegEx, '').replace(/ /g, '-');
                const _dir = join(dir, _f);
                await moveSync(fPath, _dir);

                escapeFileNames(_dir);
            }
            else escapeFileNames(fPath);
        };

        const ext = extname(f);
        const isMd = ext.toLowerCase() === '.md';
        const isQualifiedExt = ext === '.md';

        const filename = f.replace(ext, '');
        const isFilenameContainsSpecialCharacters = asciiSpecialCharRegEx.test(filename);

        const isSummary = f.toLowerCase() === 'summary.md';
        const regex = new RegExp(/^(\.|\_|sidebar)/);

        if(isMd && !isSummary && !regex.test(f)) {
            const _filename = filename.replace(asciiSpecialCharRegEx, '').replace(/ /g, '-')

            if(!isQualifiedExt || asciiSpecialCharRegEx.test(f)) {
                const _f = `${_filename}.md`;
                if(f !== _f) moveSync(fPath, join(dir, _f));
            }
        }
    });
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
