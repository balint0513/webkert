import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditFormatterPipe } from './pipes/credit-formatter.pipe';
import { CourseTypeFormatterPipe } from './pipes/course-type-formatter.pipe';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CreditFormatterPipe,
    CourseTypeFormatterPipe
  ],
  exports: [
    CreditFormatterPipe,
    CourseTypeFormatterPipe
  ]
})
export class SharedModule { }
