import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalService, Sucursal } from '../../services/sucursal.service';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-ver-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ver-sucursales.component.html',
  styleUrls: ['./ver-sucursales.component.css']
})
export class VerSucursalesComponent implements OnInit {
  sucursales: Sucursal[] = [];
  filtro: string = '';
  currentPage = 1;
  itemsPerPage = 5;
  rolUsuario: string = '';
  nombreUsuarioLogueado: string = '';

  get totalPages(): number {
    return Math.ceil(this.filtrarSucursalesSinPaginar().length / this.itemsPerPage);
  }

  constructor(
    private sucursalService: SucursalService,
    private empresaService: EmpresaService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (empresas: Empresa[]) => {
        this.sucursalService.getAllSucursales().subscribe({
          next: (sucursales) => {
            this.sucursales = sucursales.map(s => {
              const emp = empresas.find(e => e.id === s.empresaId);
              return {
                ...s,
                nombreEmpresa: emp ? emp.nombre : 'No encontrada'
              };
            }).sort((a, b) => Number(b.activo) - Number(a.activo));
          },
          error: () => Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error')
        });
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error')
    });
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }

  deshabilitarSucursal(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'La sucursal será deshabilitada',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, deshabilitar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.sucursalService.deshabilitarSucursal(id).subscribe({
          next: () => {
            Swal.fire('Deshabilitada', 'La sucursal ha sido deshabilitada', 'success');
            this.ngOnInit(); // 👈 recarga todo
          },
          error: () => Swal.fire('Error', 'No se pudo deshabilitar la sucursal', 'error')
        });
      }
    });
  }

  activarSucursal(id: number): void {
    Swal.fire({
      title: '¿Volver a activar esta sucursal?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.sucursalService.actualizarSucursal(id, { activo: true }).subscribe({
          next: () => {
            Swal.fire('Activada', 'La sucursal ha sido reactivada', 'success');
            this.ngOnInit(); // 👈 recarga todo
          },
          error: () => Swal.fire('Error', 'No se pudo activar la sucursal', 'error')
        });
      }
    });
  }

  editarSucursal(id: number): void {
    console.log('Redirigiendo a editar sucursal:', id);
    this.router.navigate(['/superadmin/editar-sucursal', id]);
  }

  filtrarSucursalesSinPaginar(): Sucursal[] {
    const filtroLower = this.filtro.toLowerCase();
    return this.sucursales
      .filter(s =>
        s.nombre.toLowerCase().includes(filtroLower) ||
        s.direccion.toLowerCase().includes(filtroLower) ||
        s.nombreEmpresa?.toLowerCase().includes(filtroLower) ||
        (s.activo ? 'activa' : 'inactiva').includes(filtroLower)
      )
      .sort((a, b) => Number(b.activo) - Number(a.activo)); // activas arriba
  }

  filtrarSucursales(): Sucursal[] {
    const inicio = (this.currentPage - 1) * this.itemsPerPage;
    const fin = inicio + this.itemsPerPage;
    return this.filtrarSucursalesSinPaginar().slice(inicio, fin);
  }

  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
