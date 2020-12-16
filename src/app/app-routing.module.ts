import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'home',
        loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: ':website/:writer/:book',
        loadChildren: () => import('./read/read.module').then( m => m.ReadPageModule)
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { 
            preloadingStrategy: PreloadAllModules,
            useHash: true
        })
    ],
    exports: [RouterModule],
})
export class AppRoutingModule { }
