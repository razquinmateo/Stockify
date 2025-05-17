import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProveedorService, SucursalProveedor, Proveedor } from '../../services/proveedor.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestionar-proveedores.component.html',
  styleUrls: ['./gestionar-proveedores.component.css']
})
export class GestionarProveedoresComponent implements OnInit {
  proveedoresAsociados: SucursalProveedor[] = [];
  proveedorSeleccionado: Proveedor = this.resetProveedor();
  esEditar: boolean = false;
  filtro: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 5;
  nombreUsuarioLogueado: string = '';

  constructor(
    private proveedorService: ProveedorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      this.proveedorService.obtenerProveedoresActivosPorSucursal(sucursalId).subscribe({
        next: (asociados) => {
          this.proveedoresAsociados = asociados;
        },
        error: () => {
          Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
        }
      });
    } else {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
    }
  }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.proveedorSeleccionado = this.resetProveedor();
    this.mostrarModal('proveedorModal');
  }

  editarProveedor(prov: SucursalProveedor): void {
    this.esEditar = true;
    this.proveedorSeleccionado = {
      id: prov.proveedorId,
      rut: prov.proveedorRut,
      nombre: prov.proveedorNombre,
      direccion: prov.proveedorDireccion,
      telefono: prov.proveedorTelefono,
      nombreVendedor: prov.proveedorNombreVendedor,
      activo: prov.proveedorActivo
    };
    this.mostrarModal('proveedorModal');
  }

  guardarProveedor(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('proveedorModal'));
    if (!this.proveedorSeleccionado.nombre || !this.proveedorSeleccionado.rut) {
      Swal.fire('Error', 'El nombre y el RUT son obligatorios', 'error');
      return;
    }

    const sucursalId = this.authService.getSucursalId();
    if (!sucursalId) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      return;
    }

    if (this.esEditar) {
      this.proveedorService.actualizarProveedor(this.proveedorSeleccionado).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Éxito', 'Proveedor actualizado correctamente', 'success');
          this.cargarDatosIniciales();
        },
        error: (err: HttpErrorResponse) => {
          let errorMessage = 'No se pudo actualizar el proveedor';
          if (err.status === 400) {
            errorMessage = err.error || 'Error en los datos proporcionados';
          } else if (err.status === 403) {
            errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
            return;
          }
          Swal.fire('Error', errorMessage, 'error');
        }
      });
    } else {
      this.proveedorService.crearProveedorConRelacion(this.proveedorSeleccionado, sucursalId).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Éxito', 'Proveedor agregado y asociado correctamente', 'success');
          this.cargarDatosIniciales();
        },
        error: (err: HttpErrorResponse) => {
          let errorMessage = 'No se pudo agregar el proveedor';
          if (err.status === 400) {
            errorMessage = err.error || 'Error en los datos proporcionados';
          } else if (err.status === 403) {
            errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
            return;
          }
          Swal.fire('Error', errorMessage, 'error');
        }
      });
    }
  }

  toggleEstadoProveedor(prov: SucursalProveedor): void {
    const accion = prov.proveedorActivo ? 'desactivar' : 'activar';
    const nuevoEstado = !prov.proveedorActivo;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `El proveedor ${prov.proveedorNombre} será ${accion}ado`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.proveedorService.toggleProveedorActivo(prov.proveedorId, nuevoEstado).subscribe({
          next: () => {
            Swal.fire('Éxito', `Proveedor ${accion}ado correctamente`, 'success');
            this.cargarDatosIniciales();
          },
          error: (err: HttpErrorResponse) => {
            Swal.fire('Error', err.error.message || `No se pudo ${accion} el proveedor`, 'error');
          }
        });
      }
    });
  }

  mostrarModal(modalId: string): void {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  }

  resetProveedor(): Proveedor {
    return {
      id: 0,
      rut: '',
      nombre: '',
      direccion: '',
      telefono: '',
      nombreVendedor: '',
      activo: true
    };
  }

  filtrarProveedores(): SucursalProveedor[] {
    return this.proveedoresAsociados.filter(prov =>
      prov.proveedorNombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      prov.proveedorRut.toLowerCase().includes(this.filtro.toLowerCase()) ||
      (prov.proveedorNombreVendedor && prov.proveedorNombreVendedor.toLowerCase().includes(this.filtro.toLowerCase())) ||
      (prov.proveedorDireccion && prov.proveedorDireccion.toLowerCase().includes(this.filtro.toLowerCase()))
    ).sort((a, b) => a.id - b.id);
  }

  obtenerProveedoresPaginados(): SucursalProveedor[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.filtrarProveedores().slice(inicio, inicio + this.elementosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.filtrarProveedores().length / this.elementosPorPagina);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}