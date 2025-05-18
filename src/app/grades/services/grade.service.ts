import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where, DocumentData } from '@angular/fire/firestore';
import { Observable, from, map, of, switchMap, catchError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { CourseService, Course } from '../../courses/services/course.service';

export interface Grade {
  id?: string;
  courseCode: string;
  dateAwarded: any; // Firestore Timestamp vagy string lehet
  grade: number;
  semester: string;
  uid: string;
  course?: Course; // Opcionális mező a kurzus adatainak tárolására
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);
  private courseService = inject(CourseService);

  // Felhasználó jegyeinek lekérdezése
  getUserGrades(): Observable<Grade[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user || !user.uid) {
          console.error('Nincs bejelentkezett felhasználó vagy hiányzik az UID');
          return of([]); // Üres tömböt ad vissza Observable-ként
        }
        const uid = user.uid;
        const gradesCollectionRef = collection(this.firestore, 'grades');
        // Közvetlen Firestore lekérdezés a felhasználó UID-jére
        const q = query(gradesCollectionRef, where('uid', '==', uid));
        return from(getDocs(q)).pipe(
          map(snapshot => {
            if (snapshot.empty) {
              // console.warn(`Nincsenek jegyek a ${uid} felhasználóhoz.`);
              return [];
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
          }),
          catchError(error => {
            console.error('Hiba a jegyek lekérdezése közben (Firestore):', error);
            return of([]); // Hiba esetén üres tömb
          })
        );
      }),
      catchError(error => {
        console.error('Hiba a felhasználói adatok lekérdezése közben (Auth):', error);
        return of([]); // Hiba esetén üres tömb
      })
    );
  }

  // Jegyek lekérdezése kurzus adatokkal együtt
  getUserGradesWithCourses(): Observable<Grade[]> {
    return this.getUserGrades().pipe(
      switchMap(grades => {
        if (grades.length === 0) {
          return of([]); // Ha nincsenek jegyek, üres tömböt ad vissza
        }
        const courseCodes = grades.map(grade => grade.courseCode).filter(cc => !!cc); // Biztosítjuk, hogy ne legyenek üres courseCode-ok

        if (courseCodes.length === 0) {
            // Ha valamiért nincsenek érvényes courseCode-ok a jegyekben
            return of(grades.map(grade => ({ ...grade, course: undefined })));
        }

        return this.courseService.getCoursesByIds(courseCodes).pipe(
          map(courses => {
            return grades.map(grade => {
              const course = courses.find(c => c.courseCode === grade.courseCode);
              return { ...grade, course: course || undefined }; // Biztosítjuk, hogy a course undefined legyen, ha nem található
            });
          }),
          catchError(error => {
            console.error('Hiba a kurzusadatok lekérdezése közben a jegyekhez:', error);
            // Hiba esetén visszaadjuk a jegyeket kurzusadatok nélkül
            return of(grades.map(grade => ({ ...grade, course: undefined })));
          })
        );
      }),
      catchError(error => {
        console.error('Általános hiba a jegyek és kurzusok kombinálása során:', error);
        return of([]); // Általános hiba esetén üres tömb
      })
    );
  }
}
