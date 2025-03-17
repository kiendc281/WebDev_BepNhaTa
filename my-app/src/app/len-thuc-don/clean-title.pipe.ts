import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cleanTitle',
  standalone: true
})
export class CleanTitlePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(/gói nguyên liệu/gi, '').trim();
  }
} 