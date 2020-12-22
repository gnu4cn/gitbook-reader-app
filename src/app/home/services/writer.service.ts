import { Injectable } from '@angular/core';

import { CrudService } from '../../services/crud.service';
import { Book, Category, Writer, Website } from '../../models';


@Injectable({
  providedIn: 'root'
})
export class WriterService {

  constructor(
        private crud: CrudService,
  ) { }
}
