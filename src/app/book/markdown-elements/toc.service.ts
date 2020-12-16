import { Injectable } from '@angular/core';

import { mergeMap } from 'rxjs/operators';

import * as MDAST from 'mdast';
import toString from 'mdast-util-to-string';
import visit from 'unist-util-visit';
import toc from 'mdast-util-toc';
import { resolve } from 'url';

import unified from 'unified';
import markdown from 'remark-parse';
import slug from 'remark-slug';
import rehypeStringify from 'rehype-stringify';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import frontmatter from 'remark-frontmatter';

import { FetchService } from '../services/fetch.service';
import { HooksService } from '../services/hooks.service';
import { links, images } from '../shared/links';
import { join } from '../shared/utils';

import { LocationService } from '../services/location.service';
import { RouterService } from '../services/router.service';

import type { TOCData, VFile } from '../book.vendor';

interface Link extends MDAST.Link {
    data: any;
}

@Injectable({
    providedIn: 'root'
})
export class TocService {
    constructor(
        private locationService: LocationService,
        private routerService: RouterService,
        private fetchService: FetchService,
    ) {
    }
    // TODO: rename below plugins

    private _processor: any;
    private minDepth = 1;
    private maxDepth = 6;
    private tight = true;

    private get processor() {
        if (this._processor) {
            return this._processor;
        }
        return this._processor = unified()
            .use(markdown)
            .use(frontmatter)
            .use(slug)
            .use(this.removeNodesPlugin, this.minDepth)
            .use(this.tocPlugin, { maxDepth: this.maxDepth, tight: this.tight })
            .use(links, { locationService: this.locationService })
        //.use(images, { locationService: this.locationService })
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
            .use(rehypeStringify);
    }

    tocVfile = (page: string) => {
        const vfile = this.locationService.pageToFile(page) as VFile;
        const fullpath = join(vfile.cwd, vfile.path);

        return this.fetchService.get(fullpath)
            .pipe(
                mergeMap(async resource => {
                    vfile.contents = resource.contents;
                    vfile.data = vfile.data || {};
                    /* const err = */ await this.processor.process(vfile);
                    return vfile;
                }),
            );
    }

    tocPlugin = (options: any) => {
        return (tree: MDAST.Root) => {
            const result = toc(tree, options);

            tree.children = [].concat(
                tree.children.slice(0, result.index),
                result.map || []
            );

            return visit(tree, 'listItem', (node: any, index: number, parent: any) => {
                if (node.children.length > 1) {
                    node.data = node.data || {};
                    node.data.hProperties = node.data.hProperties || {};
                    node.data.hProperties.class = node.data.hProperties.class || [];
                    node.data.hProperties.class.push('has-children');
                }
                return true;
            });
        };
    }

    linkPlugin = () => {
        return (tree: MDAST.Root, file: VFile) => {
            file.data = file.data || {};
            file.data.tocSearch = [];
            return visit(tree, 'link', (node: Link, index: number, parent: MDAST.Parent) => {

                file.data.tocSearch.push(this.convertToTocData(file, node, parent));
                return true;
            });
        };
    }

    removeNodesPlugin = (minDepth: number) => {
        return (tree: MDAST.Root) => {
            return visit(tree, 'heading', (node: MDAST.Heading, index: number, parent: any) => {
                if (node.depth < minDepth) {
                    parent.children.splice(index, 1);
                }
                return true;
            });
        };
    }

    private convertToTocData(file: VFile, node: Link, parent?: MDAST.Parent): TOCData {
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
        
        fragment = fragment ? fragment.replace(/^#/, '') : undefined;

        // Hack to preserve trailing slash
        if (typeof link === 'string' && link.length > 1 && link.endsWith('/')) {
            link = [link, ''];
        }

        return {
            name,
            url,
            content,
            link,
            fragment, 
            depth: node.depth as number
        };
    }
}
