import visit from 'unist-util-visit';
import toString from 'mdast-util-to-string';
import { Root, Heading, Paragraph } from 'mdast';
import { VFile as _VFile } from 'vfile';
import { Transformer, Attacher, Settings } from 'unified';

interface VFile extends _VFile {
    data: {
        matter?: any;
        title?: string;
    };
}

export function readMatter(): Transformer {
    return function transformer(node: Root, file: VFile) {
        if (node.children[0].type === 'yaml') {
            node.children[0].data = node.children[0].data || {};
            file.data.matter = node.children[0].data.parsedValue;
        }
        return node;
    };
}

export function getTitle(): Transformer {
    return (tree: Root, file: VFile) => {
        if(tree.children.findIndex(_ => _.type === 'heading') < 0 
            && !(/^\_/.test(file.basename)) 
            && tree.children.length > 0)
        {
            const heading: Heading = {
                type: 'heading',
                depth: 2,
                children: [{type: 'text', value: '未知标题'}]
            };

            tree.children.unshift(heading);
        }

        file.data = file.data || {};
        return visit(tree, 'heading', (node: Heading, index: number, parent: any) => {
            if (node.depth === 1 && !file.data.title) {
                file.data.title = toString(node);
            }
            return true;
        });
    };
}

export function correctHeadings(): Transformer {
    return (tree: Root, file: VFile) => {
        return visit(tree, 'paragraph', (node: Paragraph, index: number, parent: any) => {
            const text: string = node.children[0].value as string;

            let re = new RegExp(/^(\#){1,3}/);
            if(re.test(text)){
                const hashes = text.match(/(\#){1,3}/)[0];
                const _text = text.replace(hashes, '');

                const heading: Heading = {
                    type: 'heading',
                    depth: hashes.length as 2 | 1 | 3 | 4 | 5 | 6,
                    children: [{type: 'text', value: _text}]
                };

                parent.children.splice(index, 1, heading);
            }

        });
    };
}
