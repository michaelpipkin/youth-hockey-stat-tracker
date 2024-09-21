import { Pipe, PipeTransform } from '@angular/core';
import { Coach } from '@shared/enums';

@Pipe({
  name: 'coachRole',
  standalone: true,
})
export class CoachRolePipe implements PipeTransform {
  transform(value: string): string {
    switch (value) {
      case Coach.N:
        return '';
      case Coach.HC:
        return 'HC';
      case Coach.AC:
        return 'AC';
      case Coach.M:
        return 'M';
      default:
        return '';
    }
  }
}
