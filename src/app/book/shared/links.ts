import visit from 'unist-util-visit';
import { LocationService } from '../services/location.service';

import UNIFIED from 'unified';
import { Transformer, Attacher } from 'unified';
import { VFile } from 'vfile';
import { Node } from 'unist';
import { Image } from 'mdast';
import MDAST from 'mdast';
import { join as _join } from 'path';

import { isAbsolutePath, join } from './utils';

import type { Link } from './ast';

/**
 * Convert markdown links to router links
 *
 * @param locationService
 */
export const links = (settings: { locationService: LocationService }): Transformer => {
    return (tree: Node, vfile: VFile) => {
        return visit(tree, ['link', 'definition'], (node: Link, index: number, parent: unknown) => {
            if (node && parent && index !== undefined && !isAbsolutePath(node.url)) {

                node.data = { ...node.data };
                node.data.hProperties = { ...node.data.hProperties };

                if (!node.url || 'ignore' in node.data.hProperties || node.data.originalUrl || node.data.hProperties.target) {
                    return;
                }

                node.data.originalUrl = node.url;

                // TODO: move this to md-link comp?
                if ('download' in node.data.hProperties) {
                    node.url = settings.locationService.prepareSrc(node.url, vfile.path);
                    node.data.hProperties.source = vfile.path;
                    return true;
                }

                const re = new RegExp(/\.md/);
                
                node.url = join(re.test(node.url) ? _join(vfile.history[0], '..') : vfile.history[0], node.url);

                // tslint:disable-next-line: prefer-const
                let [routerLink = '', fragment] = node.url.split('#');
                fragment = fragment ? fragment.replace(/^#/, '') : undefined;

                node.data.hProperties.link = routerLink;
                node.data.hProperties.fragment = fragment;
                node.data.hProperties.source = vfile.history[0];
                node.data.hProperties.klass = node.data.hProperties.class;
                delete node.data.hProperties.class;

                node.data.hName = 'md-link';
            }
            return true;
        });
    };
};

export const removeLinks = (settings: { locationService: LocationService }): Transformer => {
    return (tree: Node, vfile: VFile) => {
        return visit(tree, ['link', 'definition'], (node: Link, index: number, parent: any) => {
            if (!isAbsolutePath(node.url)) {
                let text: Node;
                if(node.children) text = node.children[0];
                parent.children.splice(index, 1);
                if(text) parent.children.push(text);
            }
            return true;
        });
    };
};


export const images = function (this: UNIFIED.Processor, {locationService}: {locationService: LocationService}) {
    const processor = this;
    return async (tree: MDAST.Root, vfile: VFile) => {
        const promises: any[] = [];
        visit(tree, 'image', visitor);
        await Promise.all(promises);
        return null;

        function visitor(node: Image) {
            const p = locationService.prepareSrcAsync(node.url, vfile.path).then(url => {
                node.url = url;
            });

            promises.push(p);
            return true;
        }
    }
}
