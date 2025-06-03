import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminComponent implements OnInit {
  nombreUsuarioLogueado: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }

  gestionarEmpleados() {
    this.router.navigate(['/admin/gestionar-empleados']);
  }

  gestionarCategorias() {
    this.router.navigate(['/admin/gestionar-categorias']);
  }

  gestionarProductos() {
    this.router.navigate(['/admin/gestionar-productos']);
  }

  gestionarLotes() {
    this.router.navigate(['/admin/gestionar-lotes']);
  }

  gestionarProveedores() {
    this.router.navigate(['/admin/gestionar-proveedores']);
  }

  gestionarConteo() {
    this.router.navigate(['/admin/gestionar-conteos']);
  }

    gestionarEstadisticas() {
    this.router.navigate(['/admin/estadisticas']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}