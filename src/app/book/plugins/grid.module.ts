import { NgModule } from '@angular/core';

import { MarkdownService } from '../markdown/markdown.service';
import { customBlocks } from '../gbr-preset/index';

@NgModule({
})
export class GridPluginModule {
  constructor(markdownService: MarkdownService) {

    require('style-loader!./grid.css');

    // Adds a remarkplugin to process tab blocks
    markdownService.remarkPlugins.push([customBlocks, {
      grid: {
        classes: 'grid',
        title: 'optional'
      }
    }]);
  }
}

