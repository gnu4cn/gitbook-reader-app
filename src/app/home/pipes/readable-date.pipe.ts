import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
    differenceInYears,
    differenceInMonths,
    differenceInWeeks,
    differenceInDays,
    differenceInHours,
    differenceInMinutes
} from 'date-fns';


@Pipe({
    name: 'readableDate'
})
export class ReadableDatePipe implements PipeTransform {
    constructor (private translate: TranslateService) {}

    transform(date: Date, ...args: unknown[]): Promise<string> {
        const now = new Date();

        const years = differenceInYears(now, date);
        if(years > 0) {
            return this.translate.get(years>1 ? 'readableDate.yearsAgo' : 'readableDate.yearAgo').toPromise()
                .then(_ => { return years + ' ' + _; });
        }

        const months = differenceInMonths(now, date);
        if(months > 0) {
            return this.translate.get(months> 1 ? 'readableDate.monthsAgo' : 'readableDate.monthAgo').toPromise()
                .then(_ => { return months + ' ' + _; });
        }

        const weeks = differenceInWeeks(now, date);
        if(weeks > 0) {
            return this.translate.get(weeks>1 ? 'readableDate.weeksAgo' : 'readableDate.weekAgo').toPromise()
                .then(_ => { return weeks + ' ' + _; });
        }

        const days = differenceInDays(now, date);
        if(days > 0) {
            return this.translate.get(days>1 ? 'readableDate.daysAgo' : 'readableDate.dayAgo').toPromise()
                .then(_ => { return days + ' ' + _; });
        }

        const hours = differenceInHours(now, date);
        if(hours > 0) {
            return this.translate.get(hours>1 ? 'readableDate.hoursAgo' : 'readableDate.hourAgo').toPromise()
                .then(_ => { return hours + ' ' + _; });
        }

        const minutes = differenceInMinutes(now, date);
        return this.translate.get(minutes>1 ? 'readableDate.minutesAgo' : 'readableDate.minuteAgo').toPromise()
            .then(_ => { return minutes + ' ' + _; });
    }

}
