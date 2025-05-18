import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { UserService, UserProfile } from '../../services/user.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  userData$: Observable<UserProfile | null>;
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.userData$ = this.authService.getCurrentUser().pipe(
      switchMap(firebaseUser => {
        if (firebaseUser && firebaseUser.uid) {
          return this.userService.getUserByAuthUid(firebaseUser.uid).pipe(
            catchError(error => {
              this.errorMessage = 'Hiba történt a felhasználói adatok betöltésekor.';
              console.error('Hiba a felhasználói adatok lekérésekor:', error);
              return of(null);
            })
          );
        } else {
          this.errorMessage = 'Nincs bejelentkezett felhasználó.';
          return of(null);
        }
      }),
      catchError(error => {
        this.errorMessage = 'Hiba történt a felhasználói adatok betöltésekor.';
        console.error('Hiba a felhasználói adatok lekérésekor:', error);
        return of(null);
      })
    );
  }

  ngOnInit(): void {
    // Inicializálási logika, ha szükséges
  }
}
