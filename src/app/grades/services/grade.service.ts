import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where, DocumentData } from '@angular/fire/firestore';
import { Observable, from, map, of, switchMap, catchError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { CourseService, Course } from '../../courses/services/course.service';

export interface Grade {
  id?: string;
  courseCode: string;
  dateAwarded: any;
  grade: number;
  semester: string;
  uid: string;
  course?: Course;
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);
  private courseService = inject(CourseService);

  getUserGrades(): Observable<Grade[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user || !user.uid) {
          console.error('Nincs bejelentkezett felhasználó vagy hiányzik az UID');
          return of([]);
        }
        const uid = user.uid;
        const gradesCollectionRef = collection(this.firestore, 'grades');
        const q = query(gradesCollectionRef, where('uid', '==', uid));
        return from(getDocs(q)).pipe(
          map(snapshot => {
            if (snapshot.empty) {
              return [];
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
          }),
          catchError(error => {
            console.error('Hiba a jegyek lekérdezése közben (Firestore):', error);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error('Hiba a felhasználói adatok lekérdezése közben (Auth):', error);
        return of([]);
      })
    );
  }

  getUserGradesWithCourses(): Observable<Grade[]> {
    return this.getUserGrades().pipe(
      switchMap(grades => {
        if (grades.length === 0) {
          return of([]);
        }
        const courseCodes = grades.map(grade => grade.courseCode).filter(cc => !!cc);

        if (courseCodes.length === 0) {
            return of(grades.map(grade => ({ ...grade, course: undefined })));
        }

        return this.courseService.getCoursesByIds(courseCodes).pipe(
          map(courses => {
            return grades.map(grade => {
              const course = courses.find(c => c.courseCode === grade.courseCode);
              return { ...grade, course: course || undefined };
            });
          }),
          catchError(error => {
            console.error('Hiba a kurzusadatok lekérdezése közben a jegyekhez:', error);
            return of(grades.map(grade => ({ ...grade, course: undefined })));
          })
        );
      }),
      catchError(error => {
        console.error('Általános hiba a jegyek és kurzusok kombinálása során:', error);
        return of([]);
      })
    );
  }
}
