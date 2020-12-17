import { NgModule } from '@angular/core';

import { HooksService } from '../services/hooks.service';
import { MarkdownService } from '../markdown/markdown.service';
import { customBlocks } from '../gbr-preset/index';

@NgModule({
})
export class TabsPluginModule {
  constructor(hooks: HooksService, markdownService: MarkdownService) {

    // Adds a remarkplugin to process tab blocks
    markdownService.remarkPlugins.push([customBlocks, {
      tabs: {
        classes: 'tabs',
        title: 'optional'
      },
      tab: {
        classes: 'tab',
        title: 'optional'
      },
    }]);

    const toggleState = function (tabs: any[]) {
      tabs.forEach(tab => {
        const state = this === tab ? 'open' : 'closed';
        tab = tab.closest('.tab');
        tab.setAttribute('data-state', state);
      });
    };

    // hooks up tab blocks
    hooks.doneEach.tap('tabs-doneEach', () => {
      setTimeout(() => {
        [].slice.call(document.querySelectorAll('.tabs')).forEach((tabSet: Element) => {
          const tabs: Element[] = [].slice.call(tabSet.querySelectorAll('.tabs .tab .custom-block-heading'));
          tabs.forEach((tab, i) => {
            const state = i === 0 ? 'open' : 'closed';
            tab.closest('.tab').setAttribute('data-state', state);
            tab.addEventListener('click', toggleState.bind(tab, tabs), false);
          });
        });
      });
    });
  }
}

