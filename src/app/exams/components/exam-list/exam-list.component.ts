import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, switchMap, BehaviorSubject } from 'rxjs';
import { ExamService } from '../../services/exam.service';
import { Exam } from '../../models/exam.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../user/services/user.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-exam-list',
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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.css']
})
export class ExamListComponent implements OnInit {
  exams$: Observable<Exam[]> = of([]);
  allExams$: Observable<Exam[]> = of([]);
  enrolledExamCodes: string[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  refreshTrigger = new BehaviorSubject<boolean>(true);

  isTeacher = false;

  examForm: FormGroup;
  showExamForm = false;

  constructor(
    private examService: ExamService,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.examForm = this.fb.group({
      courseCode: ['', [Validators.required, Validators.minLength(3)]],
      courseName: ['', [Validators.required, Validators.minLength(5)]],
      examDate: ['', Validators.required],
      location: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.allExams$ = this.examService.getAllExams();

    this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          this.isLoading = false;
          return of(null);
        }

        return this.userService.getUserByAuthUid(user.uid);
      })
    ).subscribe(userProfile => {
      if (userProfile) {
        this.isTeacher = userProfile.role === 'teacher';

        if (!this.isTeacher) {
          this.loadUserExams();
        } else {
          this.isLoading = false;
        }
      } else {
        this.isLoading = false;
      }
    });
  }

  loadUserExams() {
    this.exams$ = this.refreshTrigger.pipe(
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

            this.enrolledExamCodes = userProfile.enrolledExams || [];

            if (this.enrolledExamCodes.length === 0) {
              this.isLoading = false;
              return of([]);
            }

            return this.examService.getUserExams();
          })
        );
      })
    );

    this.exams$.subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Hiba a vizsgák lekérdezésekor:', error);
        this.errorMessage = 'Hiba történt a vizsgák betöltésekor. Kérjük, próbálja újra később.';
        this.isLoading = false;
      }
    });
  }

  enrollExam(courseCode: string): void {
    this.isLoading = true;
    this.examService.enrollExam(courseCode).subscribe({
      next: (success) => {
        if (success) {
          this.refreshTrigger.next(true);
          this.snackBar.open('Vizsga sikeresen felvéve!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        } else {
          this.isLoading = false;
          this.snackBar.open('A vizsga már fel van véve vagy hiba történt', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Hiba a vizsga felvételekor:', error);
        this.errorMessage = 'Hiba történt a vizsga felvételekor. Kérjük, próbálja újra később.';
        this.isLoading = false;
        this.snackBar.open('Hiba történt a vizsga felvételekor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  discardExam(courseCode: string): void {
    this.isLoading = true;
    this.examService.discardExam(courseCode).subscribe({
      next: (success) => {
        if (success) {
          this.refreshTrigger.next(true);
          this.snackBar.open('Vizsga sikeresen leadva!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        } else {
          this.isLoading = false;
          this.snackBar.open('A vizsga nincs felvéve vagy hiba történt', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Hiba a vizsga leadásakor:', error);
        this.errorMessage = 'Hiba történt a vizsga leadásakor. Kérjük, próbálja újra később.';
        this.isLoading = false;
        this.snackBar.open('Hiba történt a vizsga leadásakor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  createExam(): void {
    if (this.examForm.invalid) {
      return;
    }

    this.isLoading = true;
    const newExam: Omit<Exam, 'id'> = {
      courseCode: this.examForm.value.courseCode,
      courseName: this.examForm.value.courseName,
      examDate: this.examForm.value.examDate,
      location: this.examForm.value.location,
      enrolledStudents: []
    };

    this.examService.createExam(newExam).subscribe({
      next: (examId) => {
        this.isLoading = false;
        this.showExamForm = false;
        this.examForm.reset();
        this.snackBar.open('Vizsga sikeresen létrehozva!', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.allExams$ = this.examService.getAllExams();
      },
      error: (error) => {
        console.error('Hiba a vizsga létrehozásakor:', error);
        this.isLoading = false;
        this.snackBar.open('Hiba történt a vizsga létrehozásakor', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  toggleExamForm(): void {
    this.showExamForm = !this.showExamForm;
    if (!this.showExamForm) {
      this.examForm.reset();
    }
  }

  isExamEnrolled(courseCode: string): boolean {
    return this.enrolledExamCodes.includes(courseCode);
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
