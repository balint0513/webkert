import { Injectable, inject } from '@angular/core';
import { Auth, onAuthStateChanged, User, signInWithEmailAndPassword, UserCredential, signOut } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);

  getCurrentUser(): Observable<User | null> {
    return new Observable<User | null>(observer => {
      const unsubscribe = onAuthStateChanged(this.auth,
        (user) => {
          observer.next(user);
        },
        (error) => {
          observer.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  async login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    return signOut(this.auth);
  }
}
