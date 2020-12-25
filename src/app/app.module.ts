import {
    LocationStrategy,
    HashLocationStrategy
} from '@angular/common';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { LoadingBarModule } from '@ngx-loading-bar/core';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';

import { NgxElectronModule } from 'ngx-electron';

import { CacheInterceptor } from './services/cache.interceptor';
import { CrudService } from './services/crud.service';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { environment } from '../environments/environment';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        NgxElectronModule,
        BrowserAnimationsModule,
        LoadingBarModule,
        LoadingBarHttpClientModule,
        RouterModule,
        AppRoutingModule,
    ],
    providers: [
        StatusBar,
        SplashScreen,
        CacheInterceptor,
        CrudService,
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        {provide: APP_BASE_HREF, useValue: '/'},
        { provide: LocationStrategy, useClass: HashLocationStrategy }
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
