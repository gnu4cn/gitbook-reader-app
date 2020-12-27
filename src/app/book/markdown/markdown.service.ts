import { Injectable, InjectionToken, Inject, Optional } from '@angular/core';

import { resolve } from 'url';

import { Observable, of } from 'rxjs';
import { 
    mergeMap,
    catchError,
    map,
    reduce
} from 'rxjs/operators';

import unified from 'unified';
import remark from 'remark';
import remark2rehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import raw from 'rehype-raw';
import frontmatter from 'remark-frontmatter';
import slug from 'remark-slug';
import visit from 'unist-util-visit';
import toString from 'mdast-util-to-string';
import strip from 'remark-strip-html';
import sectionize from 'remark-sectionize';

import { getTitle } from '../gbr-preset/index';
import { tocPlugin } from '../plugins/toc';
import { removeNodesPlugin } from '../plugins/remove';
import { sectionPlugin } from '../plugins/sections';

import { CrudService } from '../../services/crud.service';
import { LocationService } from '../services/location.service';
import { RouterService } from '../services/router.service';
import { SettingsService } from '../services/settings.service';
import { HooksService } from '../services/hooks.service';
import { FetchService } from '../services/fetch.service';

import { links, images, removeLinks } from '../shared/links';
import lazyInitialize from '../shared/lazy-init';
import { join } from '../shared/utils';

import { VFile, isVfile, Preset, TOCOptions, TOCData, SectionData } from '../shared/vfile';
import type { Link } from '../shared/ast';
import type * as mdast from 'mdast';
import type { VFileCompatible } from 'vfile';

export const MARKDOWN_CONFIG_TOKEN = new InjectionToken<any>( 'forRoot() configuration.' );

@Injectable({
    providedIn: 'root'
})
export class MarkdownService {
    // Lazy init processor
    @lazyInitialize
    get processor(): unified.Processor {
        return remark()
            .use(this.remarkPlugins)
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
        // TODO: rehype plugins
            .use(rehypeStringify);
    }

    @lazyInitialize
    get processorPreview(): unified.Processor {
        return remark()
            .use(this.remarkPlugins)
            .use(removeLinks, { locationService: this.locationService })
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
        // TODO: rehype plugins
            .use(rehypeStringify);
    }

    @lazyInitialize
    private get tocProcessor() {
        return remark()
            .use(frontmatter)
            .use(slug)
            .use(getTitle)
            .use(removeNodesPlugin)
            .use(tocPlugin)
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(this.linkPlugin)
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
            .use(rehypeStringify);
    }

    @lazyInitialize
    private get linksProcessor() {
        return remark()
            .use(frontmatter)
            .use(slug)
            .use(this.linkPlugin)
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
            .use(rehypeStringify);
    }

    /**
     * Processor for extracting sections from md
     */
    @lazyInitialize
    private get sectionProcessor() {
        return remark()
            .use(slug)
            .use(getTitle)
            .use(strip)
            .use(sectionize)
            .use(sectionPlugin);
    }

    get remarkPlugins(): unified.PluggableList {
        if (Array.isArray(this.config)) {
            return this.config;
        }
        return this.config.plugins;
    }

    get bookPath () {
        return this.settings.bookPath;
    }

    constructor(
        private locationService: LocationService,
        private routerService: RouterService,
        private crud: CrudService,
        private settings: SettingsService,
        private fetchService: FetchService,
        private hooks: HooksService,
        @Optional() @Inject(MARKDOWN_CONFIG_TOKEN) private config: Preset
    ) {
        this.config = this.config || { plugins: [] };
        this.config.plugins = this.config.plugins || [];
    }

    linkPlugin = () => {
        return (tree: mdast.Root, file: VFile) => {
            file.data = file.data || {};
            file.data.tocSearch = [];  // TODO: rename
            return visit(tree, 'link', (node: Link, index: number, parent: mdast.Parent) => {
                file.data.tocSearch.push(this.convertToTocData(file, node, parent));
                return true;
            });
        };
    }

    private convertToTocData(file: VFile, node: Link, parent?: mdast.Parent): TOCData {
        const content = toString(node);
        const name = (file.data.matter ? file.data.matter.title : false) || file.data.title || file.path;

        let { url } = node;
        let link: string | string[] = '';
        let fragment = '';

        if (node.data && node.data.hName === 'md-link') {
            // resolve path relative to source document
            url = resolve(node.data.hProperties.source, url);
            link = node.data.hProperties.link as string;
            fragment = node.data.hProperties.fragment;

            link = this.locationService.prepareLink(link, this.routerService.root);
        } else {
            [link = '', fragment] = url.split('#');
        }

        // Hack to preserve trailing slash
        if (typeof link === 'string' && link.length > 1 && link.endsWith('/')) {
            link = [link, ''];
        }

        return {
            name,
            url,
            content,
            link,
            fragment: fragment ? fragment.replace(/^#/, '') : undefined,
            depth: node.depth as number
        };
    }
    /**
     * Process MD
     */
    async process(vf: VFile) {
        await this.hooks.beforeEach.promise(vf);
        const err = await this.processor.process(vf);
        await this.hooks.afterEach.promise(err || vf);
        return err || vf;
    }

    async processPreview(vf: VFile) {
        await this.hooks.beforeEach.promise(vf);
        const err = await this.processorPreview.process(vf);
        await this.hooks.afterEach.promise(err || vf);
        return err || vf;
    }

    /**
     * Get TOC
     */
    async processTOC(doc: VFileCompatible, options?: TOCOptions): Promise<VFile> {
        const file = VFile(doc);
        file.data.tocOptions = {
            ...(file.data?.tocOptions || {}),
            ...options,
        };
        const err = await this.tocProcessor.process(file) as VFile;
        return err || file;
    }

    async processLinks(doc: VFileCompatible) {
        const file = VFile(doc) as VFile;
        const err = await this.linksProcessor.process(file) as VFile;
        return err || file;
    }

    /**
     * Get Sections
     */
    async getSections(doc: VFileCompatible): Promise<SectionData[]> {
        const file = isVfile(doc) ? doc : VFile(String(doc)) as VFile;
        const tree = this.sectionProcessor.parse(file);
        await this.sectionProcessor.run(tree, file);
        file.data.title = (file.data.matter ? file.data.matter.title : false) || file.data.title || file.path;
        return file.data?.sections || [];
    }

    async getTocLinks(doc: VFileCompatible): Promise<TOCData[]> {
        const file = isVfile(doc) ? doc : VFile(String(doc)) as VFile;
        file.data = file.data || {};
        await this.processLinks(file);
        return file.data.tocSearch;
    }

    loadSummaryFromBackend = (): Promise<string[]> => {
        return of(this.crud.ipcRenderer.sendSync('summary-request', this.bookPath)).pipe(
            catchError((err: any) => Observable.throw(err.json))
        ).toPromise();
    }

    loadSummaryFromFile = (_vfile: VFile, summaryPath: string): Promise<string[]> => {
        return this.fetchService.get(summaryPath).pipe(
            mergeMap(resource => {
                _vfile.contents = resource.contents;
                _vfile.data = _vfile.data || {};
                return resource.notFound ? of(null) : this.processLinks(_vfile);
            }),
            map((_: any) => {
                return _.data.tocSearch.reduce((acc: Array<string>, __: any): Array<string> => {
                        return __ 
                        && (/\.md$/.test(__.url.split('#')[0])) 
                        && (acc.findIndex(path => path === (
                            /^\//.test(__.url.split('#')[0]) 
                            ? __.url.split('#')[0] 
                            : `/${__.url.split('#')[0]}`
                        )) < 0) 
                        ? [...acc, decodeURI(/^\//.test(__.url.split('#')[0]) ? __.url.split('#')[0] : `/${__.url.split('#')[0]}`)] 
                        : acc;
                    }, []) as Array<string>;
            }),
            catchError((err: any) => Observable.throw(err.json))
        ).toPromise();
    }

    loadSummary = async (summary: string) => {
        const _vfile = this.locationService.pageToFile(summary);

        const fullPath = await this.fetchService.find(_vfile.cwd, _vfile.path);

        const pathsFromBackend: Array<string> = await this.loadSummaryFromBackend();

        if(fullPath){
            const pathsFromFile: Array<string> = await this.loadSummaryFromFile(_vfile, fullPath);

            // 把从后台获取的 paths 补充到 pathsFromFile 中
            pathsFromBackend.map((_: string) => { 
                if(pathsFromFile.findIndex((__: string) => __ === _) < 0) pathsFromFile.push(_); 
            });

            return pathsFromFile;
        }

        return pathsFromBackend;
    }

    getPageToc = (page: string, minDepth: number = 1, maxDepth: number = 6, tight: boolean = true) => {
        const vfile = this.locationService.pageToFile(page) as VFile;
        const fullpath = join(vfile.cwd, vfile.path);

        return this.fetchService.get(fullpath)
            .pipe(
                mergeMap(async resource => {
                    vfile.contents = resource.contents;
                    vfile.data = vfile.data || {};
                    vfile.notFound = resource.notFound;
                    /* const err = */ await this.processTOC(vfile, {
                    minDepth: +minDepth,
                        // @ts-ignore
                        maxDepth: +maxDepth,
                        tight: tight
                });
                    return vfile;
                }),
            );
    }
}
