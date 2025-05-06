import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  empresas: Empresa[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  filtro: string = '';

  get totalPages(): number {
    return Math.ceil(this.filtrarEmpresasSinPaginar().length / this.itemsPerPage);
  }

  constructor(
    private authService: AuthService,
    private empresaService: EmpresaService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data: Empresa[]) => this.empresas = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error')
    });
  }

  editarEmpresa(id: number): void {
    this.router.navigate(['/superadmin/editar-empresa', id]);
  }

  deshabilitarEmpresa(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'La empresa será deshabilitada',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, deshabilitar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.empresaService.deshabilitarEmpresa(id).subscribe({
          next: () => {
            Swal.fire('Deshabilitada', 'La empresa ha sido deshabilitada', 'success');
            this.cargarEmpresas();
          },
          error: () => Swal.fire('Error', 'No se pudo deshabilitar la empresa', 'error')
        });
      }
    });
  }

  activarEmpresa(id: number): void {
    Swal.fire({
      title: '¿Volver a activar esta empresa?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.empresaService.actualizarEmpresa(id, { activo: true }).subscribe({
          next: () => {
            Swal.fire('Activada', 'La empresa ha sido reactivada', 'success');
            this.cargarEmpresas(); // recarga la tabla para ver el cambio
          },
          error: () => Swal.fire('Error', 'No se pudo activar la empresa', 'error')
        });
      }
    });
  }

  filtrarEmpresasSinPaginar(): Empresa[] {
    const filtroLower = this.filtro.toLowerCase();

    return this.empresas
      .filter(e =>
        e.nombre.toLowerCase().includes(filtroLower) ||
        e.rut.toLowerCase().includes(filtroLower) ||
        e.direccion.toLowerCase().includes(filtroLower) ||
        e.telefono.toLowerCase().includes(filtroLower) ||
        (e.activo ? 'activa' : 'inactiva').includes(filtroLower)
      )
      .sort((a, b) => Number(b.activo) - Number(a.activo)); // 👈 activa (true=1) primero
  }

  filtrarEmpresas(): Empresa[] {
    const inicio = (this.currentPage - 1) * this.itemsPerPage;
    const fin = inicio + this.itemsPerPage;
    return this.filtrarEmpresasSinPaginar().slice(inicio, fin);
  }

  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
