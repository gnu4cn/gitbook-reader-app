import headings from '@rigor789/remark-autolink-headings';
import frontmatter from 'remark-frontmatter';
import simplePlantUML from '@akebifiky/remark-simple-plantuml';
import gfm from 'remark-gfm';
import math from 'remark-math';
import katex from 'remark-html-katex';
import gemojiToEmoji from 'remark-gemoji-to-emoji';
import parseFrontmatter from 'remark-parse-yaml';
import slug from 'remark-slug';
import reporter from 'vfile-reporter';
import sectionize from 'remark-sectionize';
import externalLinks from 'remark-external-links';

import { readMatter, getTitle, correctHeadings } from './plugins/frontmatter';
import { infoString, infoStringToAttr } from './plugins/misc';
import { prism } from './plugins/prism';
import { mermaid } from './plugins/mermaid';

import visit from 'unist-util-visit';
import { Root } from 'mdast';
import { VFile } from 'vfile';
import { Transformer } from 'unified';

export { prism, mermaid, reporter, getTitle, correctHeadings };

export function moveIds(): Transformer {
    return (tree: Root, file: VFile) => {
        return visit(tree, 'heading', (node: any, index: number, parent: any) => {
            if (parent.type === 'section' && node.data && node.data.hProperties && node.data.hProperties.id) {
                parent.data = parent.data || Object.create(null);
                parent.data.hProperties = parent.data.hProperties || Object.create(null);
                parent.data.hProperties.id = node.data.hProperties.id;
                delete node.data.hProperties.id;
            }
            return true;
        });
    };
}

export const plugins = [
    frontmatter,
    gfm,
    parseFrontmatter,
    readMatter,
    correctHeadings,
    getTitle,
    infoString,
    slug,
    [ headings, { behaviour: 'append' } ],
    [ externalLinks,  {target: '_blank', rel: ['nofollow']}],
    sectionize,
    moveIds,
    math,
    katex,
    gemojiToEmoji,
    simplePlantUML,
    infoStringToAttr,
    mermaid,
    prism
];

export const settings = {};

export const preset = {
    settings,
    plugins,
    reporter
};

export default preset;
