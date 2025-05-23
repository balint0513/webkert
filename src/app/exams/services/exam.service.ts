import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc, arrayUnion, getDoc, addDoc, query, where } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of, combineLatest } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { UserService, UserProfile } from '../../user/services/user.service';
import { Exam } from '../models/exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  getAllExams(): Observable<Exam[]> {
    const examsCollectionRef = collection(this.firestore, 'exams');

    return from(getDocs(examsCollectionRef)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          console.warn('Nincsenek vizsgák az adatbázisban.');
          return [];
        }
        return snapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() } as Exam;
        });
      })
    );
  }

  getUserExams(): Observable<Exam[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.userService.getUserByAuthUid(user.uid).pipe(
          switchMap(userProfile => {
            if (!userProfile) {
              return of([]);
            }

            const enrolledExams = userProfile.enrolledExams || [];

            if (enrolledExams.length === 0) {
              return of([]);
            }

            return this.getAllExams().pipe(
              map(exams => {
                return exams.filter(exam => enrolledExams.includes(exam.courseCode));
              })
            );
          })
        );
      })
    );
  }

  enrollExam(courseCode: string): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          console.error('Nincs bejelentkezett felhasználó');
          return of(false);
        }

        return this.userService.getUserByAuthUid(user.uid).pipe(
          switchMap(userProfile => {
            if (!userProfile || !userProfile.id) {
              console.error('Nem található felhasználó');
              return of(false);
            }

            if (userProfile.role === 'teacher') {
              console.error('Tanárok nem vehetnek fel vizsgát');
              return of(false);
            }


            const enrolledExams = userProfile.enrolledExams || [];

            if (enrolledExams.includes(courseCode)) {
              console.log('A vizsga már fel van véve');
              return of(false);
            }

            const userDocRef = doc(this.firestore, 'users', userProfile.id);
            return from(updateDoc(userDocRef, {
              enrolledExams: arrayUnion(courseCode)
            })).pipe(
              map(() => {
                console.log('Vizsga sikeresen felvéve');
                return true;
              })
            );
          })
        );
      })
    );
  }

  discardExam(courseCode: string): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          console.error('Nincs bejelentkezett felhasználó');
          return of(false);
        }

        return this.userService.getUserByAuthUid(user.uid).pipe(
          switchMap(userProfile => {
            if (!userProfile || !userProfile.id) {
              console.error('Nem található felhasználó');
              return of(false);
            }

            const enrolledExams = userProfile.enrolledExams || [];

            if (!enrolledExams.includes(courseCode)) {
              console.log('A vizsga nincs felvéve, nem lehet leadni');
              return of(false);
            }

            const userDocRef = doc(this.firestore, 'users', userProfile.id);
            const updatedExams = enrolledExams.filter((code: string) => code !== courseCode);

            return from(updateDoc(userDocRef, {
              enrolledExams: updatedExams
            })).pipe(
              map(() => {
                console.log('Vizsga sikeresen leadva');
                return true;
              })
            );
          })
        );
      })
    );
  }

  createExam(exam: Omit<Exam, 'id'>): Observable<string> {
    const examsCollectionRef = collection(this.firestore, 'exams');

    return from(addDoc(examsCollectionRef, exam)).pipe(
      map(docRef => {
        console.log('Vizsga sikeresen létrehozva, ID:', docRef.id);
        return docRef.id;
      })
    );
  }
}
