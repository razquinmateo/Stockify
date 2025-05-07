import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';;

@Component({
  selector: 'app-ver-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ver-empresas.component.html',
  styleUrls: ['./ver-empresas.component.css']
})
export class VerEmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  filtro: string = '';
  currentPage = 1;
  itemsPerPage = 5;
  nombreUsuarioLogueado: string = '';


  constructor(
    private empresaService: EmpresaService,
    private authService: AuthService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.cargarEmpresas();
  }  

  cargarEmpresas(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data: Empresa[]) => this.empresas = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error')
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filtrarEmpresasSinPaginar().length / this.itemsPerPage);
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
      .sort((a, b) => Number(b.activo) - Number(a.activo));
  }

  filtrarEmpresas(): Empresa[] {
    const inicio = (this.currentPage - 1) * this.itemsPerPage;
    return this.filtrarEmpresasSinPaginar().slice(inicio, inicio + this.itemsPerPage);
  }

  deshabilitarEmpresa(id: number): void {
    Swal.fire({
      title: 'Deshabilitar empresa?',
      text: 'Esta empresa será deshabilitada',
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
            this.cargarEmpresas();
          },
          error: () => Swal.fire('Error', 'No se pudo activar la empresa', 'error')
        });
      }
    });
  }

  editarEmpresa(id: number): void {
    // navegamos a la vista de edición
    location.href = `/superadmin/editar-empresa/${id}`;
  }

  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
