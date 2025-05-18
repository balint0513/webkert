import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'creditFormatter',
  standalone: true
})
export class CreditFormatterPipe implements PipeTransform {
  transform(value: number): string {
    return `${value} kredit`;
  }
}
