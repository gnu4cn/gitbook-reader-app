import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatChipsModule} from '@angular/material/chips';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import {MatSnackBarModule} from '@angular/material/snack-bar';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatProgressBarModule,
        MatInputModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDialogModule,
        MatCardModule,
        MatToolbarModule,
        MatDividerModule,
        FormsModule,
        MatIconModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatButtonModule,
    ],
    exports: [
        MatButtonModule,
        MatInputModule,
        ReactiveFormsModule,
        MatChipsModule,
        MatDialogModule,
        MatCardModule,
        MatAutocompleteModule,
        MatSnackBarModule,
        FormsModule,
        MatIconModule,
        MatProgressBarModule,
        MatDividerModule,
        MatTooltipModule,
        MatToolbarModule,
        FlexLayoutModule,
        MatFormFieldModule,
    ]
})
export class MaterialModule { }
