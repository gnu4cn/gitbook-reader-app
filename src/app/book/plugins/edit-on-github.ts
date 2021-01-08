import { Component, Input, OnInit, SimpleChanges } from '@angular/core';

import { RouterService } from '../services/router.service';
import { LocationService } from '../services/location.service';
import { SettingsService } from '../services/settings.service';

import { join } from '../shared/utils';
import { join as _join } from 'path';

@Component({
    selector: 'docspa-edit-on-github', // tslint:disable-line
    template: `<a [attr.href]="href" target="_blank"><ng-content></ng-content></a>`,
    styles: []
})
export class EditOnGithubComponent implements OnInit {
    static readonly is = 'md-edit-on-github';

    private path: string;

    get bookPath () {
        return this.settings.bookPath;
    }

    get storageId () {
        return this.bookPath.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, ':');
    }

    get defaultBranch () {
        return localStorage.getItem(this.storageId+':defaultBranch');
    }

    get docEditBase () {
        return join('https://', _join(this.bookPath, 'edit', this.defaultBranch));
    }

    get href() {
        return this.docEditBase + (/^\//.test(this.path) ? this.path : '/'+this.path);
    }

    constructor(
        private routerService: RouterService, 
        private locationService: LocationService,
        private settings: SettingsService
    ) {}

    ngOnInit() {
        this.setPath(this.routerService.contentPage);
        this.routerService.changed.subscribe((changes: SimpleChanges) => {
            if ('contentPage' in changes) {
                this.setPath(changes.contentPage.currentValue);
            }
        });
    }

    setPath(page: string) {
        const vfile = this.locationService.pageToFile(page);
        this.path = vfile.path[0] === '/' ? vfile.path.slice(1,) : vfile.path;
    }
}
