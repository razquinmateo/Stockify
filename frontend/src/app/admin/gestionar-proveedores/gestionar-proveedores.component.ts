import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProveedorService, Proveedor, SucursalProveedor } from '../../services/proveedor.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './gestionar-proveedores.component.html',
  styleUrls: ['./gestionar-proveedores.component.css']
})
export class GestionarProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor = this.resetProveedor();
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  esEditar: boolean = false;
  filtro: string = '';
  filtroProductos: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 5;
  nombreUsuarioLogueado: string = '';

  constructor(
    private proveedorService: ProveedorService,
    private productoService: ProductoService,
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
      forkJoin({
        proveedores: this.proveedorService.obtenerProveedoresPorSucursal(sucursalId),
        productos: this.productoService.obtenerProductosActivosPorSucursal(sucursalId)
      }).subscribe({
        next: ({ proveedores, productos }) => {
          this.proveedores = proveedores;
          this.productos = productos;
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

  abrirModalProductos(prov: Proveedor): void {
    this.proveedorSeleccionado = { ...prov };
    this.filtroProductos = '';
    this.filtrarProductos();
    this.mostrarModal('productosModal');
  }

  cerrarModalProductosFuera(event: MouseEvent): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('productosModal'));
    if (event.target === event.currentTarget) {
      modal.hide();
    }
  }

  editarProveedor(prov: Proveedor): void {
    this.esEditar = true;
    this.proveedorService.getById(prov.id).subscribe({
      next: (proveedor: Proveedor) => {
        this.proveedorSeleccionado = {
          id: proveedor.id,
          rut: proveedor.rut,
          nombre: proveedor.nombre,
          direccion: proveedor.direccion,
          telefono: proveedor.telefono,
          nombreVendedor: proveedor.nombreVendedor,
          activo: proveedor.activo,
          productoIds: proveedor.productoIds || []
        };
        this.mostrarModal('proveedorModal');
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar el proveedor', 'error');
      }
    });
  }

  guardarProveedor(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('proveedorModal'));
    if (!this.proveedorSeleccionado.nombre || !this.proveedorSeleccionado.rut) {
      Swal.fire('Error', 'El nombre y el RUT son obligatorios', 'error');
      return;
    }

    const proveedorToSave: Proveedor = {
      ...this.proveedorSeleccionado,
      productoIds: this.proveedorSeleccionado.productoIds || []
    };

    const sucursalId = this.authService.getSucursalId();
    if (sucursalId === null) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      return;
    }

    if (this.esEditar) {
      this.proveedorService.actualizarProveedor(proveedorToSave).subscribe({
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
      this.proveedorService.crearProveedor(proveedorToSave).subscribe({
        next: (proveedor: Proveedor) => {
          this.proveedorService.linkSucursalProveedor(sucursalId, proveedor.id).subscribe({
            next: () => {
              modal.hide();
              Swal.fire('Éxito', 'Proveedor agregado y vinculado correctamente a la sucursal', 'success');
              this.cargarDatosIniciales();
            },
            error: (err: HttpErrorResponse) => {
              let errorMessage = 'No se pudo vincular el proveedor a la sucursal';
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
                  this.router.navigate(['//login']);
                });
                return;
              }
              Swal.fire('Error', errorMessage, 'error');
            }
          });
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
              this.router.navigate(['//login']);
            });
            return;
          }
          Swal.fire('Error', errorMessage, 'error');
        }
      });
    }
  }

  toggleEstadoProveedor(prov: Proveedor): void {
    const accion = prov.activo ? 'desactivar' : 'activar';
    const nuevoEstado = !prov.activo;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `El proveedor ${prov.nombre} será ${accion}ado`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.proveedorService.toggleProveedorActivo(prov.id, nuevoEstado).subscribe({
          next: () => {
            Swal.fire('Éxito', `Proveedor ${accion}ado correctamente`, 'success');
            this.cargarDatosIniciales();
          },
          error: (err: HttpErrorResponse) => {
            Swal.fire('Error', err.error?.message || `No se pudo ${accion} el proveedor`, 'error');
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
      activo: true,
      productoIds: []
    };
  }

  filtrarProveedores(): Proveedor[] {
    return this.proveedores.filter(prov =>
      (prov.nombre ? prov.nombre.toLowerCase().includes(this.filtro.toLowerCase()) : false) ||
      (prov.rut ? prov.rut.toLowerCase().includes(this.filtro.toLowerCase()) : false) ||
      (prov.nombreVendedor ? prov.nombreVendedor.toLowerCase().includes(this.filtro.toLowerCase()) : false) ||
      (prov.direccion ? prov.direccion.toLowerCase().includes(this.filtro.toLowerCase()) : false)
    ).sort((a, b) => a.id - b.id);
  }

  filtrarProductos(): void {
    if (!this.proveedorSeleccionado.productoIds || this.proveedorSeleccionado.productoIds.length === 0) {
      this.productosFiltrados = [];
      return;
    }
    this.productosFiltrados = this.productos.filter(producto =>
      this.proveedorSeleccionado.productoIds!.includes(producto.id) &&
      (this.filtroProductos
        ? producto.nombre.toLowerCase().includes(this.filtroProductos.toLowerCase()) ||
          (producto.detalle && producto.detalle.toLowerCase().includes(this.filtroProductos.toLowerCase()))
        : true)
    );
  }

  obtenerProductosFiltrados(): Producto[] {
    return this.productosFiltrados;
  }

  obtenerProveedoresPaginados(): Proveedor[] {
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

  getProductoNombres(productoIds: number[] | undefined): string {
    if (!productoIds || productoIds.length === 0) return 'Sin Productos';
    return productoIds
      .map(id => {
        const producto = this.productos.find(p => p.id === id);
        return producto ? producto.nombre : 'Desconocido';
      })
      .join(', ');
  }
}