import { NgModule } from '@angular/core';

import { HooksService } from '../services/hooks.service';
import * as VFILE from 'vfile';

/* An example plugin module */

@NgModule({
})
export class TestPluginModule {
  constructor(hooks: HooksService) {
    hooks.afterEach.tap('docsify-beforeEach', (vf: VFILE.VFile) => {
      vf.contents += ` HTML generated ${new Date()} `;
      return vf;
    });
  }
}
