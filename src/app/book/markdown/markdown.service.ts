import { Injectable, InjectionToken, Inject, Optional } from '@angular/core';

import unified from 'unified';
import remark from 'remark';
const gfm = require('remark-gfm');
import remark2rehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import raw from 'rehype-raw';
const externalLinks = require('remark-external-links');

import { LocationService } from '../services/location.service';
import { HooksService } from '../services/hooks.service';
import { links, images, removeLinks } from '../shared/links';
import lazyInitialize from '../shared/lazy-init';

import type { VFile } from '../shared/vfile';

export const MARKDOWN_CONFIG_TOKEN = new InjectionToken<any>( 'forRoot() configuration.' );

interface Preset extends unified.Preset {
    reporter?: (vfile: VFile) => {};
}

@Injectable({
    providedIn: 'root'
})
export class MarkdownService {
    // Lazy init processor
    @lazyInitialize
    get processor(): unified.Processor {
        return remark()
            .use(gfm)
            .use(this.remarkPlugins)
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(externalLinks)
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
        // TODO: rehype plugins
            .use(rehypeStringify);
    }

    @lazyInitialize
    get processorPreview(): unified.Processor {
        return remark()
            .use(gfm)
            .use(this.remarkPlugins)
            .use(removeLinks, { locationService: this.locationService })
            .use(links, { locationService: this.locationService })
            .use(images, { locationService: this.locationService })
            .use(externalLinks)
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
        // TODO: rehype plugins
            .use(rehypeStringify);
    }

    get remarkPlugins(): unified.PluggableList {
        if (Array.isArray(this.config)) {
            return this.config;
        }
        return this.config.plugins;
    }

    constructor(
        private locationService: LocationService,
        private hooks: HooksService,
        @Optional() @Inject(MARKDOWN_CONFIG_TOKEN) private config: Preset
    ) {
        this.config = this.config || { plugins: [] };
        this.config.plugins = this.config.plugins || [];
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
}
