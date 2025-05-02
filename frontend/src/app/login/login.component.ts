import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  nombreUsuario: string = '';
  contrasenia: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';
    const credentials = { nombreUsuario: this.nombreUsuario, contrasenia: this.contrasenia };
    this.authService.login(credentials).subscribe({
      next: () => {
        const role = this.authService.getUserRole();
        switch (role) {
          case 'SUPERADMINISTRADOR':
            this.router.navigate(['/superadmin/dashboard']);
            break;
          case 'ADMINISTRADOR':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'EMPLEADO':
            this.router.navigate(['/empleado/dashboard']);
            break;
          default:
            this.errorMessage = 'Rol no reconocido';
        }
        
      },
      error: (err) => {
        this.errorMessage = 'Credenciales incorrectas o usuario inactivo';
        console.error('Login error:', err);
      }
    });
  }
}