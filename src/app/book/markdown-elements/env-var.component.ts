import { Component, Input, Optional, Inject, OnChanges } from '@angular/core';
import { GBR_ENVIRONMENT } from '../gbr.tokens';

@Component({
  selector: 'docspa-env', // tslint:disable-line
  template: `{{value}}`,
  styles: []
})
export class EnvVarComponent implements OnChanges {
  static readonly is = 'md-env';

  @Input()
  var: string;

  value: string;

  constructor(@Optional() @Inject(GBR_ENVIRONMENT) private environment: any) {}

  ngOnChanges() {
    this.value = String(this.var ? this.environment[this.var] : '');
  }
}


