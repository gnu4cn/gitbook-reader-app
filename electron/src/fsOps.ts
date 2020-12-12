import { resolve, extname, basename } from 'path';
import { readdirSync, statSync } from 'fs';
import { moveSync } from 'fs-extra';

import { asciiSpecialCharRegEx } from './vendor';

export const escapeFileNames = async (dir: string) => {
    dir = resolve(__dirname, dir);
    const fileList = readdirSync(dir);

    await fileList.map(f => {
        const fPath = `${dir}/${f}`;

        const isDir = statSync(fPath).isDirectory();

        if (isDir && (f !== '.git')) {
            if(asciiSpecialCharRegEx.test(f)) {
                const _f = f.replace(asciiSpecialCharRegEx, '').replace(/ /g, '-');
                const _fPath = `${dir}/${_f}`;
                moveSync(fPath, _fPath);

                escapeFileNames(_fPath);
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
                if(f !== _f) moveSync(fPath, `${dir}/${_f}`);
            }
        }
    });
}

const lookupMdFiles = (dir: string): Array<string> => {
    dir = resolve(__dirname, dir);
    const fileList = readdirSync(dir);

    return fileList.reduce((acc: Array<string>, f: string): Array<string> => {
        const fPath = `${dir}/${f}`;

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

const sortFn = (a: string, b: string) => {
    const regex = new RegExp(/[0-9][0-9]?[0-9]?/)
    const testA = a.match(regex);
    const testB = b.match(regex);
    const aN: number = testA ? parseInt(testA[0]) : 0;
    const bN: number = testB ? parseInt(testB[0]) : 0;

    return aN-bN;
}

export const getList = (dir: string): Array<string> => {
    const list = lookupMdFiles(dir).reduce((acc: Array<string>, i: string): Array<string> => {
        return i ? [...acc, i.replace(dir, '')] : acc;
    }, []);

    return list.sort(sortFn);
}

//getList('../app/assets/lmdy/CTF-All-In-One').map(i => console.log(i))
