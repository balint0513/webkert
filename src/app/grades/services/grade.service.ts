import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, of, forkJoin, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Grade } from '../models/grade.model';
import { AuthService } from '../../auth/services/auth.service';
import { CourseService } from '../../courses/services/course.service';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  getAllGrades(): Observable<Grade[]> {
    const gradesCollection = collection(this.firestore, 'grades');
    return collectionData(gradesCollection, { idField: 'id' }).pipe(
      map(grades => grades as Grade[]),
      switchMap(grades => {
        if (grades.length === 0) return of([]);

        const uniqueCourseCodes = [...new Set(grades.map(grade => grade.courseCode))];

        return this.courseService.getCoursesByIds(uniqueCourseCodes).pipe(
          map(courses => {
            const courseMap = new Map(courses.map(course => [course.courseCode, course]));

            return grades.map(grade => ({
              ...grade,
              course: courseMap.get(grade.courseCode) ? {
                courseName: courseMap.get(grade.courseCode)?.courseName,
                teacherName: courseMap.get(grade.courseCode)?.teacherName,
                credits: courseMap.get(grade.courseCode)?.credits,
                type: courseMap.get(grade.courseCode)?.type
              } : undefined
            }));
          })
        );
      }),
      catchError(error => {
        console.error('Hiba a jegyek lekérdezésekor:', error);
        return throwError(() => new Error('Hiba a jegyek lekérdezésekor'));
      })
    );
  }

  getUserGrades(neptunCode: string): Observable<Grade[]> {
    const gradesCollection = collection(this.firestore, 'grades');
    const userGradesQuery = query(gradesCollection, where('neptunCode', '==', neptunCode));

    return collectionData(userGradesQuery, { idField: 'id' }).pipe(
      map(grades => grades as Grade[]),
      switchMap(grades => {
        if (grades.length === 0) return of([]);

        const uniqueCourseCodes = [...new Set(grades.map(grade => grade.courseCode))];

        return this.courseService.getCoursesByIds(uniqueCourseCodes).pipe(
          map(courses => {
            const courseMap = new Map(courses.map(course => [course.courseCode, course]));

            return grades.map(grade => ({
              ...grade,
              course: courseMap.get(grade.courseCode) ? {
                courseName: courseMap.get(grade.courseCode)?.courseName,
                teacherName: courseMap.get(grade.courseCode)?.teacherName,
                credits: courseMap.get(grade.courseCode)?.credits,
                type: courseMap.get(grade.courseCode)?.type
              } : undefined
            }));
          })
        );
      }),
      catchError(error => {
        console.error('Hiba a felhasználó jegyeinek lekérdezésekor:', error);
        return throwError(() => new Error('Hiba a felhasználó jegyeinek lekérdezésekor'));
      })
    );
  }

  createGrade(grade: Omit<Grade, 'id'>): Observable<string> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('Nincs bejelentkezett felhasználó'));
        }

        const gradesCollection = collection(this.firestore, 'grades');
        return from(addDoc(gradesCollection, grade)).pipe(
          map(docRef => docRef.id)
        );
      }),
      catchError(error => {
        console.error('Hiba a jegy létrehozásakor:', error);
        return throwError(() => new Error('Hiba a jegy létrehozásakor'));
      })
    );
  }
}
