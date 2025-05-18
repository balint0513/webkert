import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  user$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.user$ = this.authService.getCurrentUser();
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      // Sikeres kijelentkezés után átirányítás a bejelentkezési oldalra
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Hiba a kijelentkezés során:', error);
    }
  }
}
