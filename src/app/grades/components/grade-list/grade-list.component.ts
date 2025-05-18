import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

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
import { MatDividerModule } from '@angular/material/divider';

import { GradeService } from '../../services/grade.service';
import { Grade } from '../../models/grade.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../user/services/user.service';

@Component({
  selector: 'app-grade-list',
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
    MatDividerModule
  ],
  templateUrl: './grade-list.component.html',
  styleUrls: ['./grade-list.component.css']
})
export class GradeListComponent implements OnInit, OnDestroy {
  grades$: Observable<Grade[]> = of([]);
  allGrades$: Observable<Grade[]> = of([]);
  isLoading = true;
  errorMessage: string | null = null;
  refreshTrigger = new BehaviorSubject<boolean>(true);

  isTeacher = false;
  gradeForm: FormGroup;
  showGradeForm = false;

  private destroy$ = new Subject<void>();

  constructor(
    private gradeService: GradeService,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.gradeForm = this.fb.group({
      neptunCode: ['', Validators.required],
      courseCode: ['', [Validators.required, Validators.minLength(3)]],
      grade: [null, Validators.required],
      semester: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          this.isLoading = false;
          return of(null);
        }
        return this.userService.getUserByAuthUid(user.uid);
      }),
      takeUntil(this.destroy$)
    ).subscribe(userProfile => {
      if (userProfile) {
        this.isTeacher = userProfile.role === 'teacher';

        if (this.isTeacher) {
          this.allGrades$ = this.gradeService.getAllGrades();
          this.isLoading = false;
        } else {
          this.loadUserGrades();
        }
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserGrades() {
    this.grades$ = this.refreshTrigger.pipe(
      switchMap(() => this.authService.getCurrentUser()),
      switchMap(user => {
        if (!user) {
          this.isLoading = false;
          return of([]);
        }
        return this.userService.getUserByAuthUid(user.uid).pipe(
          switchMap(userProfile => {
            if (!userProfile) {
              this.isLoading = false;
              return of([]);
            }

            return this.gradeService.getUserGrades(userProfile.neptunCode);
          })
        );
      }),
      takeUntil(this.destroy$)
    );

    this.grades$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Hiba a jegyek lekérdezésekor:', error);
        this.errorMessage = 'Hiba történt a jegyek betöltésekor. Kérjük, próbálja újra később.';
        this.isLoading = false;
      }
    });
  }

  toggleGradeForm(): void {
    this.showGradeForm = !this.showGradeForm;
    if (!this.showGradeForm) {
      this.gradeForm.reset();
    }
  }

  createGrade(): void {
    if (this.gradeForm.invalid) {
      this.gradeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const newGrade: Omit<Grade, 'id'> = {
      neptunCode: this.gradeForm.value.neptunCode,
      courseCode: this.gradeForm.value.courseCode,
      grade: this.gradeForm.value.grade,
      semester: this.gradeForm.value.semester,
      dateAwarded: new Date()
    };

    this.gradeService.createGrade(newGrade).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.showGradeForm = false;
        this.gradeForm.reset();
        this.refreshTrigger.next(true);
        this.allGrades$ = this.gradeService.getAllGrades();

        this.snackBar.open('Jegy sikeresen beírva!', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Hiba a jegy beírásakor:', error);
        this.isLoading = false;
        this.snackBar.open('Hiba történt a jegy beírásakor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return 'Ismeretlen dátum';

    try {
      if (date.toDate) {
        date = date.toDate();
      }

      if (typeof date === 'string') {
        date = new Date(date);
      }

      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Hiba a dátum formázásakor:', error);
      return 'Érvénytelen dátum';
    }
  }
}
