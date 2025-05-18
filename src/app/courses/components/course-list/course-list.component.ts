import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { CourseService, Course } from '../../services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../user/services/user.service';
import { CreditFormatterPipe } from '../../../shared/pipes/credit-formatter.pipe';
import { CourseTypeFormatterPipe } from '../../../shared/pipes/course-type-formatter.pipe';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    CreditFormatterPipe,
    CourseTypeFormatterPipe
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit, OnDestroy {
  courses$: Observable<Course[]> = of([]);
  allCourses$: Observable<Course[]> = of([]);
  enrolledCourseCodes: string[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  refreshTrigger = new BehaviorSubject<boolean>(true);

  isTeacher = false;
  courseForm: FormGroup;
  showCourseForm = false;

  private destroy$ = new Subject<void>();

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.courseForm = this.fb.group({
      courseCode: ['', [Validators.required, Validators.minLength(3)]],
      courseName: ['', [Validators.required, Validators.minLength(5)]],
      credits: [2, [Validators.required, Validators.min(1), Validators.max(30)]],
      schedule: ['', Validators.required],
      semester: ['', Validators.required],
      teacherName: ['', Validators.required],
      type: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.allCourses$ = this.courseService.getAllCourses();

    this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          this.isLoading = false;
          this.isTeacher = false;
          this.enrolledCourseCodes = [];
          this.courses$ = of([]);
          return of(null);
        }
        return this.userService.getUserByAuthUid(user.uid);
      }),
      takeUntil(this.destroy$)
    ).subscribe(userProfile => {
      this.isLoading = false;
      if (userProfile) {
        this.isTeacher = userProfile.role === 'teacher';
        if (!this.isTeacher) {
          this.loadUserCourses();
        } else {
          this.enrolledCourseCodes = [];
          this.courses$ = of([]);
        }
      } else {
        this.isTeacher = false;
        this.enrolledCourseCodes = [];
        this.courses$ = of([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserCourses() {
    this.courses$ = this.refreshTrigger.pipe(
      switchMap(() => this.authService.getCurrentUser()),
      switchMap(user => {
        if (!user) {
          this.isLoading = false;
          return of([]);
        }
        return this.userService.getUserByAuthUid(user.uid).pipe(
          switchMap(userProfile => {
            if (!userProfile || userProfile.role === 'teacher') {
              this.isLoading = false;
              this.enrolledCourseCodes = [];
              return of([]);
            }
            this.enrolledCourseCodes = userProfile.enrolledCourses || [];
            if (this.enrolledCourseCodes.length === 0) {
              this.isLoading = false;
              return of([]);
            }
            return this.courseService.getCoursesByIds(this.enrolledCourseCodes);
          })
        );
      }),
      takeUntil(this.destroy$)
    );

    this.courses$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Hiba a kurzusok lekérdezésekor:', error);
        this.errorMessage = 'Hiba történt a kurzusok betöltésekor. Kérjük, próbálja újra később.';
        this.isLoading = false;
      }
    });
  }

  enrollCourse(courseCode: string): void {
    this.isLoading = true;
    this.courseService.enrollCourse(courseCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (success) => {
        if (success) {
          this.refreshTrigger.next(true);
          this.snackBar.open('Kurzus sikeresen felvéve!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        } else {
          this.isLoading = false;
          this.snackBar.open('A kurzus már fel van véve vagy hiba történt', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Hiba a kurzus felvételekor:', error);
        this.errorMessage = 'Hiba történt a kurzus felvételekor. Kérjük, próbálja újra később.';
        this.isLoading = false;
        this.snackBar.open('Hiba történt a kurzus felvételekor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  discardCourse(courseCode: string): void {
    this.isLoading = true;
    this.courseService.discardCourse(courseCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (success) => {
        if (success) {
          this.refreshTrigger.next(true);
          this.snackBar.open('Kurzus sikeresen leadva!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        } else {
          this.isLoading = false;
          this.snackBar.open('A kurzus nincs felvéve vagy hiba történt', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Hiba a kurzus leadásakor:', error);
        this.errorMessage = 'Hiba történt a kurzus leadásakor. Kérjük, próbálja újra később.';
        this.isLoading = false;
        this.snackBar.open('Hiba történt a kurzus leadásakor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  isCourseEnrolled(courseCode: string): boolean {
    return this.enrolledCourseCodes.includes(courseCode);
  }

  toggleCourseForm(): void {
    this.showCourseForm = !this.showCourseForm;
    if (!this.showCourseForm) {
      this.courseForm.reset({
        credits: 2
      });
    }
  }

  createCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const newCourse: Omit<Course, 'id'> = this.courseForm.value;

    this.courseService.createCourse(newCourse).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (courseId) => {
        this.isLoading = false;
        this.showCourseForm = false;
        this.courseForm.reset({
          credits: 2
        });

        this.refreshTrigger.next(true);
        this.allCourses$ = this.courseService.getAllCourses();

        this.snackBar.open('Kurzus sikeresen létrehozva!', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Hiba a kurzus létrehozásakor:', error);
        this.isLoading = false;
        this.snackBar.open('Hiba történt a kurzus létrehozásakor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
