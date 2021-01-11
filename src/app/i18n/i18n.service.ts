import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    languages: Array<string> = ['zh', 'en'];
    
    constructor(
        private translate: TranslateService
    ) {
        translate.addLangs(this.languages);
        translate.setDefaultLang('en');
        //translate.use(this.browserLang.match(/zh|en/) ? this.browserLang : 'en');
        translate.use('en')
    }

    get browserLang () {
        return this.translate.getBrowserLang(); 
    }
}
