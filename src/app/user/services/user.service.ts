import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export interface UserProfile {
  id?: string;
  createdAt: any;
  displayName: string;
  email: string;
  enrolledCourses: string[];
  enrolledExams: string[];
  neptunCode: string;
  role: string;
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);

  getUserByNeptunCode(neptunCode: string): Observable<UserProfile | null> {
    const usersCollectionRef = collection(this.firestore, 'users');
    const q = query(usersCollectionRef, where('neptunCode', '==', neptunCode), limit(1));

    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          console.warn(`Nem található felhasználó ezzel a NepToon kóddal: ${neptunCode}`);
          return null;
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
      })
    );
  }

  getUserByAuthUid(authUid: string): Observable<UserProfile | null> {
    const usersCollectionRef = collection(this.firestore, 'users');
    const q = query(usersCollectionRef, where('uid', '==', authUid), limit(1));

    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          console.warn(`Nem található felhasználó ezzel az UID-val: ${authUid}`);
          return null;
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
      })
    );
  }
}
