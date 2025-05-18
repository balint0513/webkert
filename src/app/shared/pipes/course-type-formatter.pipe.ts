import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'courseTypeFormatter',
  standalone: true
})
export class CourseTypeFormatterPipe implements PipeTransform {
  transform(value: string): string {
    const typeMap: { [key: string]: string } = {
      'ea': 'Előadás',
      'gy': 'Gyakorlat',
      'lab': 'Labor',
      'szem': 'Szeminárium'
    };

    return typeMap[value.toLowerCase()] || value;
  }
}
