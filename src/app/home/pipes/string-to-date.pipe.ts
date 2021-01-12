import { Pipe, PipeTransform } from '@angular/core';

import {
    parseISO,
} from 'date-fns';


@Pipe({
  name: 'stringToDate'
})
export class StringToDatePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): Date {
    return parseISO(value);
  }

}
