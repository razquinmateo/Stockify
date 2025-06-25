import { Component, OnInit } from '@angular/core';
import { LoteService, Lote } from '../../services/lote.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-gestionar-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './gestionar-lotes.component.html',
  styleUrls: ['./gestionar-lotes.component.css']
})
export class GestionarLotesComponent implements OnInit {
  lotes: Lote[] = [];
  lotesFiltrados: Lote[] = [];
  productos: Producto[] = [];
  loteSeleccionado: Lote = {
    id: 0,
    numeroLote: '',
    fechaIngreso: '',
    fechaVencimiento: null,
    cantidadStock: 0,
    activo: true,
    productoId: null
  };
  filtro: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 10;
  maxPaginasMostradas: number = 5;
  esEditar: boolean = false;
  nombreUsuarioLogueado: string = '';
  sucursalId: number | null = null;

  constructor(
    private loteService: LoteService,
    private productoService: ProductoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.sucursalId = this.authService.getSucursalId();
    if (this.sucursalId) {
      this.cargarProductos();
      this.cargarLotes();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener el ID de la sucursal',
      }).then(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      });
    }
  }

  cargarProductos(): void {
    if (this.sucursalId) {
      this.productoService.obtenerProductosActivosPorSucursal(this.sucursalId).subscribe({
        next: (productos) => {
          this.productos = productos;
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Error al cargar los productos';
          if (error.status === 403) {
            errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `${errorMessage}: ${error.message}`,
            });
          }
        }
      });
    }
  }

  cargarLotes(): void {
    if (this.sucursalId) {
      this.loteService.obtenerLotesPorSucursal(this.sucursalId).subscribe({
        next: (lotes) => {
          this.lotes = lotes;
          this.filtrarLotes();
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Error al cargar los lotes';
          if (error.status === 403) {
            errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `${errorMessage}: ${error.message}`,
            });
          }
        }
      });
    }
  }

  filtrarLotes(): void {
    this.lotesFiltrados = this.lotes.filter(lote =>
      lote.numeroLote.toLowerCase().includes(this.filtro.toLowerCase())
    );
    this.paginaActual = 1;
  }

  obtenerLotesPaginados(): Lote[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.lotesFiltrados.slice(inicio, inicio + this.elementosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.lotesFiltrados.length / this.elementosPorPagina);
  }

  getProductoNombre(productoId: number | null): string | null {
    if (!productoId) return null;
    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : null;
  }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.loteSeleccionado = {
      id: 0,
      numeroLote: '',
      fechaIngreso: '',
      fechaVencimiento: null,
      cantidadStock: 0,
      activo: true,
      productoId: null
    };
    const modalElement = document.getElementById('loteModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  editarLote(lote: Lote): void {
    this.esEditar = true;
    this.loteSeleccionado = { ...lote };
    const modalElement = document.getElementById('loteModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  guardarLote(): void {
    if (!this.loteSeleccionado.numeroLote || !this.loteSeleccionado.fechaIngreso) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El número de lote y la fecha de ingreso son obligatorios',
      });
      return;
    }
    if (this.loteSeleccionado.cantidadStock == null || this.loteSeleccionado.cantidadStock < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'La cantidad de stock debe ser mayor o igual a 0',
      });
      return;
    }
    if (!this.loteSeleccionado.productoId) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto requerido',
        text: 'Debe seleccionar un producto',
      });
      return;
    }

    const loteData: Lote = {
      ...this.loteSeleccionado,
      activo: true
    };

    if (this.esEditar) {
      this.loteService.actualizarLote(loteData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Lote actualizado',
            text: 'El lote ha sido actualizado correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          this.cargarLotes();
          this.cerrarModal();
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Error al actualizar el lote';
          if (error.status === 403) {
            errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else if (error.status === 400) {
            errorMessage = error.error || 'Error en los datos proporcionados';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `${errorMessage}: ${error.message}`,
            });
          }
        }
      });
    } else {
      this.loteService.agregarLote(loteData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Lote agregado',
            text: 'El lote ha sido agregado correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          this.cargarLotes();
          this.cerrarModal();
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Error al agregar el lote';
          if (error.status === 403) {
            errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else if (error.status === 400) {
            errorMessage = error.error || 'Error en los datos proporcionados';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `${errorMessage}: ${error.message}`,
            });
          }
        }
      });
    }
  }

  toggleEstadoLote(lote: Lote): void {
    const accion = lote.activo ? 'desactivar' : 'activar';
    Swal.fire({
      icon: 'question',
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} lote?`,
      text: `¿Estás seguro de que deseas ${accion} el lote ${lote.numeroLote}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, ' + accion,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (lote.activo) {
          this.loteService.desactivarLote(lote.id).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Lote desactivado',
                text: 'El lote ha sido desactivado correctamente',
                timer: 1500,
                showConfirmButton: false
              });
              lote.activo = false;
              this.filtrarLotes();
            },
            error: (error: HttpErrorResponse) => {
              let errorMessage = 'Error al desactivar el lote';
              if (error.status === 403) {
                errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: errorMessage,
                }).then(() => {
                  this.authService.logout();
                  this.router.navigate(['/login']);
                });
              } else if (error.status === 400) {
                errorMessage = error.error || 'Error en los datos proporcionados';
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: errorMessage,
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: `${errorMessage}: ${error.message}`,
                });
              }
            }
          });
        } else {
          this.loteService.actualizarLote({ ...lote, activo: true }).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Lote activado',
                text: 'El lote ha sido activado correctamente',
                timer: 1500,
                showConfirmButton: false
              });
              lote.activo = true;
              this.filtrarLotes();
            },
            error: (error: HttpErrorResponse) => {
              let errorMessage = 'Error al activar el lote';
              if (error.status === 403) {
                errorMessage = 'Acceso denegado. Por favor, inicia sesión nuevamente.';
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: errorMessage,
                }).then(() => {
                  this.authService.logout();
                  this.router.navigate(['/login']);
                });
              } else if (error.status === 400) {
                errorMessage = error.error || 'Error en los datos proporcionados';
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: errorMessage,
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: `${errorMessage}: ${error.message}`,
                });
              }
            }
          });
        }
      }
    });
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('loteModal');
    if (modalElement) {
      const modal = Modal.getInstance(modalElement);
      modal?.hide();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Método para cambiar de página
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual = pagina;
    }
  }

  // Método para calcular las páginas intermedias a mostrar
  paginasMostradas(): number[] {
    const total = this.totalPaginas();
    const paginas: number[] = [];
    const rango = Math.floor(this.maxPaginasMostradas / 2);

    let inicio = Math.max(2, this.paginaActual - rango);
    let fin = Math.min(total - 1, this.paginaActual + rango);

    // Ajustar el rango para mantener un número fijo de páginas visibles
    if (fin - inicio + 1 < this.maxPaginasMostradas) {
      if (this.paginaActual < total / 2) {
        fin = Math.min(total - 1, inicio + this.maxPaginasMostradas - 1);
      } else {
        inicio = Math.max(2, fin - this.maxPaginasMostradas + 2);
      }
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }
}