import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc, arrayUnion, getDoc, addDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export interface Course {
  id?: string;
  courseCode: string;
  courseName: string;
  credits: number;
  schedule: string;
  semester: string;
  teacherName: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

  getAllCourses(): Observable<Course[]> {
    const coursesCollectionRef = collection(this.firestore, 'courses');

    return from(getDocs(coursesCollectionRef)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          console.warn('Nincsenek kurzusok az adatbázisban.');
          return [];
        }
        return snapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() } as Course;
        });
      })
    );
  }

  getCoursesByIds(courseCodes: string[]): Observable<Course[]> {
    if (!courseCodes || courseCodes.length === 0) {
      return from([[]]);
    }

    return this.getAllCourses().pipe(
      map(courses => {
        return courses.filter(course => courseCodes.includes(course.courseCode));
      })
    );
  }

  enrollCourse(courseCode: string): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          console.error('Nincs bejelentkezett felhasználó');
          return of(false);
        }

        const usersCollectionRef = collection(this.firestore, 'users');

        return from(getDocs(usersCollectionRef)).pipe(
          map(snapshot => {
            const userDoc = snapshot.docs.find(doc => doc.data()['uid'] === user.uid);

            if (!userDoc) {
              console.error('Nem található felhasználó ezzel az UID-val:', user.uid);
              return false;
            }

            const userData = userDoc.data();
            if (userData['role'] === 'teacher') {
              console.error('Tanárok nem vehetnek fel kurzusokat');
              return false;
            }

            const enrolledCourses = userData['enrolledCourses'] || [];

            if (enrolledCourses.includes(courseCode)) {
              console.log('A kurzus már fel van véve');
              return false;
            }

            const userDocRef = doc(this.firestore, 'users', userDoc.id);
            return from(updateDoc(userDocRef, {
              enrolledCourses: arrayUnion(courseCode)
            })).pipe(
              map(() => {
                console.log('Kurzus sikeresen felvéve');
                return true;
              })
            );
          }),
          switchMap(result => {
            if (typeof result === 'boolean') {
              return of(result);
            }
            return result;
          })
        );
      })
    );
  }

  discardCourse(courseCode: string): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          console.error('Nincs bejelentkezett felhasználó');
          return of(false);
        }

        const usersCollectionRef = collection(this.firestore, 'users');

        return from(getDocs(usersCollectionRef)).pipe(
          map(snapshot => {
            const userDoc = snapshot.docs.find(doc => doc.data()['uid'] === user.uid);

            if (!userDoc) {
              console.error('Nem található felhasználó ezzel az UID-val:', user.uid);
              return false;
            }

            const userData = userDoc.data();
            const enrolledCourses = userData['enrolledCourses'] || [];

            if (!enrolledCourses.includes(courseCode)) {
              console.log('A kurzus nincs felvéve, nem lehet leadni');
              return false;
            }

            const userDocRef = doc(this.firestore, 'users', userDoc.id);
            const updatedCourses = enrolledCourses.filter((code: string) => code !== courseCode);

            return from(updateDoc(userDocRef, {
              enrolledCourses: updatedCourses
            })).pipe(
              map(() => {
                console.log('Kurzus sikeresen leadva');
                return true;
              })
            );
          }),
          switchMap(result => {
            if (typeof result === 'boolean') {
              return of(result);
            }
            return result;
          })
        );
      })
    );
  }

  createCourse(course: Omit<Course, 'id'>): Observable<string> {
    const coursesCollectionRef = collection(this.firestore, 'courses');

    return from(addDoc(coursesCollectionRef, course)).pipe(
      map(docRef => {
        console.log('Kurzus sikeresen létrehozva, ID:', docRef.id);
        return docRef.id;
      })
    );
  }
}
