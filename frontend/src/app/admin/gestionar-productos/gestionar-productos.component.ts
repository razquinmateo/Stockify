import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { LoteService, Lote } from '../../services/lote.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Observable, of } from 'rxjs';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestionar-productos.component.html',
  styleUrls: ['./gestionar-productos.component.css']
})
export class GestionarProductosComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  productoSeleccionado!: Producto;
  loteSeleccionado: Lote = this.resetLote();
  esEditar: boolean = false;
  filtro: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 5;
  nombreUsuarioLogueado: string = '';
  mostrarCamara: boolean = false;
  videoElement: HTMLVideoElement | null = null;
  canvas: HTMLCanvasElement = document.createElement('canvas');

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private loteService: LoteService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.productoSeleccionado = this.resetProducto();
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      forkJoin({
        productos: this.productoService.obtenerTodosLosProductos(),
        categorias: this.categoriaService.obtenerTodasLasCategorias()
      }).subscribe({
        next: ({ productos, categorias }) => {
          this.categorias = categorias.filter(cat => cat.sucursalId === sucursalId);
          const categoriaRequests: Observable<any>[] = productos.map(prod =>
            prod.categoriaId
              ? this.productoService.obtenerCategoriaPorId(prod.categoriaId)
              : of({ nombre: 'Sin Categoría' })
          );
          forkJoin(categoriaRequests).subscribe({
            next: (categoriaResponses) => {
              productos.forEach((prod, index) => {
                prod.categoriaNombre = categoriaResponses[index].nombre;
              });
              this.productos = productos.filter(prod => prod.sucursalId === sucursalId);
            },
            error: () => {
              Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
            }
          });
        },
        error: () => {
          Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
        }
      });
    } else {
      this.productos = [];
      this.categorias = [];
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
    }
  }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.productoSeleccionado = this.resetProducto();
    this.mostrarCamara = false;
    this.mostrarModal('productoModal');
  }

  editarProducto(prod: Producto): void {
    this.esEditar = true;
    this.productoSeleccionado = { ...prod };
    this.mostrarCamara = false;
    this.mostrarModal('productoModal');
  }

  abrirModalAgregarLote(prod: Producto): void {
    this.loteSeleccionado = this.resetLote();
    this.loteSeleccionado.productoId = prod.id;
    this.mostrarModal('loteModal');
  }

  guardarLote(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loteModal'));
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
        text: 'Debe estar asociado a un producto',
      });
      return;
    }

    const loteData: Lote = {
      ...this.loteSeleccionado,
      activo: true
    };

    this.loteService.agregarLote(loteData).subscribe({
      next: () => {
        modal.hide();
        Swal.fire({
          icon: 'success',
          title: 'Lote agregado',
          text: 'El lote ha sido agregado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
        this.cargarDatosIniciales(); // Recargar productos para actualizar stock
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

  toggleEstadoProducto(prod: Producto): void {
    const accion = prod.activo ? 'deshabilitar' : 'activar';
    const nuevoEstado = !prod.activo;
    Swal.fire({
      title: `¿Estás seguro?`,
      text: `El producto será ${accion}o`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const productoActualizado = { ...prod, activo: nuevoEstado };
        this.productoService.actualizarProducto(productoActualizado).subscribe({
          next: () => {
            Swal.fire('Éxito', `Producto ${accion}o correctamente`, 'success');
            this.cargarDatosIniciales();
          },
          error: (err: HttpErrorResponse) => {
            Swal.fire('Error', err.error.message || `No se pudo ${accion} el producto`, 'error');
          }
        });
      }
    });
  }

  guardarProducto(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));
    if (!this.productoSeleccionado.nombre ||
        !this.productoSeleccionado.codigoBarra ||
        this.productoSeleccionado.categoriaId === 0 ||
        this.productoSeleccionado.precio < 0 ||
        this.productoSeleccionado.cantidadStock < 0) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos correctamente', 'error');
      return;
    }
    if (this.productoSeleccionado.imagen) {
      const imgSizeBytes = atob(this.productoSeleccionado.imagen.split(',')[1]).length;
      if (imgSizeBytes > 1_000_000) {
        Swal.fire('Error', 'La imagen no debe exceder 1MB', 'error');
        return;
      }
      if (!this.productoSeleccionado.imagen.match(/^data:image\/(jpeg|png);base64,.+/)) {
        Swal.fire('Error', 'La imagen debe ser un formato JPEG o PNG válido', 'error');
        return;
      }
    }
    const productoToSave = { ...this.productoSeleccionado };
    if (this.esEditar) {
      this.productoService.actualizarProducto(productoToSave).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Actualizado', 'El producto ha sido actualizado', 'success');
          this.cargarDatosIniciales();
          this.cerrarCamara();
        },
        error: (err: HttpErrorResponse) => {
          Swal.fire('Error', err.error.message || 'No se pudo actualizar el producto', 'error');
        }
      });
    } else {
      this.productoService.agregarProducto(productoToSave).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Agregado', 'El producto ha sido agregado', 'success');
          this.cargarDatosIniciales();
          this.cerrarCamara();
        },
        error: (err: HttpErrorResponse) => {
          Swal.fire('Error', err.error.message || 'No se pudo agregar el producto', 'error');
        }
      });
    }
  }

  mostrarModal(modalId: string): void {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  }

  resetProducto(): Producto {
    return {
      id: 0,
      codigoBarra: '',
      imagen: '',
      nombre: '',
      detalle: '',
      precio: 0,
      cantidadStock: 0,
      sucursalId: this.authService.getSucursalId() || 0,
      categoriaId: 0,
      activo: true
    };
  }

  resetLote(): Lote {
    return {
      id: 0,
      numeroLote: '',
      fechaIngreso: '',
      fechaVencimiento: null,
      cantidadStock: 0,
      activo: true,
      productoId: null
    };
  }

  filtrarProductos(): Producto[] {
    return this.productos.filter(prod =>
      prod.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      prod.detalle.toLowerCase().includes(this.filtro.toLowerCase()) ||
      prod.codigoBarra.includes(this.filtro) ||
      prod.id.toString().includes(this.filtro) ||
      (prod.categoriaNombre && prod.categoriaNombre.toLowerCase().includes(this.filtro.toLowerCase()))
    ).sort((a, b) => a.id - b.id);
  }

  obtenerProductosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.filtrarProductos().slice(inicio, inicio + this.elementosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.filtrarProductos().length / this.elementosPorPagina);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 1_000_000) {
        Swal.fire('Error', 'La imagen no debe exceder 1MB', 'error');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        if (!imageData.match(/^data:image\/(jpeg|png);base64,.+/)) {
          Swal.fire('Error', 'La imagen debe ser un formato JPEG o PNG válido', 'error');
          input.value = '';
          return;
        }
        this.productoSeleccionado.imagen = imageData;
      };
      reader.readAsDataURL(file);
    }
  }

  abrirCamara(): void {
    this.mostrarCamara = true;
    setTimeout(() => {
      this.videoElement = document.getElementById('video') as HTMLVideoElement;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            if (this.videoElement) {
              this.videoElement.srcObject = stream;
            }
          })
          .catch(err => {
            Swal.fire('Error', 'No se pudo acceder a la cámara: ' + err.message, 'error');
            this.mostrarCamara = false;
          });
      } else {
        Swal.fire('Error', 'La API de la cámara no está soportada en este navegador', 'error');
        this.mostrarCamara = false;
      }
    }, 0);
  }

  capturarFoto(): void {
    if (this.videoElement) {
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.videoElement, 0, 0);
        const imageData = this.canvas.toDataURL('image/jpeg');
        const imgSizeBytes = atob(imageData.split(',')[1]).length;
        if (imgSizeBytes > 1_000_000) {
          Swal.fire('Error', 'La imagen capturada no debe exceder 1MB', 'error');
          return;
        }
        this.productoSeleccionado.imagen = imageData;
        this.cerrarCamara();
      }
    }
  }

  cerrarCamara(): void {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    this.mostrarCamara = false;
  }
}