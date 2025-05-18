import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const { email, password } = this.loginForm.value;

      // Ellenőrizzük, hogy az email és jelszó nem undefined vagy üres
      if (!email || !password) {
        throw new Error('Email és jelszó megadása kötelező');
      }

      const success = await this.authService.login(email, password);

      if (success) {
        this.router.navigate(['/user/profile']); // Átirányítás a profil oldalra sikeres bejelentkezés után
      } else {
        this.errorMessage = 'Sikertelen bejelentkezés. Kérjük, ellenőrizze az adatait.';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage = error.message || 'Hiba történt a bejelentkezés során.';

      // Javítás: Ellenőrizzük, hogy az errorMessage nem null
      this.snackBar.open(this.errorMessage || 'Hiba történt a bejelentkezés során.', 'Bezárás', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }
}
