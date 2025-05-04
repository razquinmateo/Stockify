import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  constructor(private authService: AuthService, private router: Router) {}

  gestionarEmpleados() {
      this.router.navigate(['/admin/gestionar_empleados']);
    }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
