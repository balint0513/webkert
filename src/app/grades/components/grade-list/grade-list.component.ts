import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { GradeService, Grade } from '../../services/grade.service';
import { AuthService } from '../../../auth/services/auth.service';

// Material importok
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-grade-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './grade-list.component.html',
  styleUrls: ['./grade-list.component.css']
})
export class GradeListComponent implements OnInit {
  grades$: Observable<Grade[]> = of([]);
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private gradeService: GradeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    this.isLoading = true;
    this.grades$ = this.gradeService.getUserGradesWithCourses();

    // Feliratkozás a jegyekre, hogy az isLoading állapotot frissítsük
    this.grades$.subscribe({
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

  // Dátum formázása olvasható formátumra
  formatDate(date: any): string {
    if (!date) return 'Ismeretlen dátum';

    try {
      // Ha Timestamp objektum, akkor konvertáljuk Date-té
      if (date.toDate) {
        date = date.toDate();
      }

      // Ha string, akkor próbáljuk meg Date objektummá alakítani
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
