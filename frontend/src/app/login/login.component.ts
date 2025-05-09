import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  nombreUsuario: string = '';
  contrasenia: string = '';
  errorMessage: string = '';
  mostrarContrasenia: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    //verificar si el usuario ya está autenticado al cargar el componente
    if (this.authService.isAuthenticated()) {
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
          this.authService.logout(); //si el rol no es reconocido, hacer logout
          this.router.navigate(['/login']);
      }
    }
  }

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
            this.router.navigate(['/admin']);
            break;
          case 'EMPLEADO':
            this.router.navigate(['/empleado']);
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
