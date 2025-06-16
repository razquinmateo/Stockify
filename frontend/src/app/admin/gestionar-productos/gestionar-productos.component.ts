import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ProductoService,
  Producto,
  Proveedor,
} from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { LoteService, Lote } from '../../services/lote.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Observable, of } from 'rxjs';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './gestionar-productos.component.html',
  styleUrls: ['./gestionar-productos.component.css'],
})
export class GestionarProductosComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];
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
  ) {}

  ngOnInit(): void {
    this.productoSeleccionado = this.resetProducto();
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.cargarDatosIniciales();
  }

  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const productosExcelRaw = XLSX.utils.sheet_to_json(hoja);

      let detectoErrorFecha = false;

      // Normalizar claves y parsear precios
      const productosExcel = productosExcelRaw.map((prod: any) => {
        const productoNormalizado: any = {};

        for (const clave in prod) {
          const valor = prod[clave];
          const claveLower = clave.toLowerCase().trim();

          if (
            [
              'codigo',
              'código',
              'código de barras',
              'codigo de barras',
              'barcode',
            ].includes(claveLower)
          ) {
            productoNormalizado.codigoBarra = valor;
          } else if (
            ['precio', 'precio unitario', 'coste'].includes(claveLower)
          ) {
            if (typeof valor === 'number' && valor > 40000) {
              detectoErrorFecha = true;
              productoNormalizado.precio = null; // ignorar precio con formato fecha
            } else {
              productoNormalizado.precio = this.parsearPrecio(valor);
            }
          } else if (
            ['stock', 'cantidad', 'cantidad stock', 'existencia'].includes(
              claveLower
            )
          ) {
            productoNormalizado.cantidadStock =
              typeof valor === 'number' ? valor : parseInt(valor, 10);
          } else {
            productoNormalizado[clave] = valor;
          }
        }

        return productoNormalizado;
      });

      // Filtrar productos con código y precio o cantidad válida
      const productosValidos = productosExcel.filter(
        (p) =>
          p.codigoBarra &&
          (typeof p.precio === 'number' || typeof p.cantidadStock === 'number')
      );

      if (detectoErrorFecha) {
        // Mostrar advertencia pero seguir con la actualización si hay productos válidos
        Swal.fire({
          icon: 'warning',
          title: 'Posible error en el archivo Excel',
          html: `
              <p>El archivo contiene valores que parecen <b>fechas</b> en la columna de <b>precios</b>  .</p>
              <p><u>Estos precios serán ignorados.</u></p>
              <hr />
              <p><b>Solución:</b> Abre el archivo Excel, selecciona la columna de precios y cámbiala al formato <b>Texto</b>.</p>
            `,
          confirmButtonText: 'Entendido',
        }).then(() => {
          if (productosValidos.length > 0) {
            this.actualizarProductosDesdeExcel(productosValidos);
          } else {
            // No hay productos válidos para actualizar después de ignorar precios con formato fecha
            Swal.fire(
              'Archivo inválido',
              'No se encontraron productos válidos para actualizar.',
              'warning'
            );
          }
        });
      } else {
        // No hay errores, actualizar normalmente si hay productos válidos
        if (productosValidos.length > 0) {
          this.actualizarProductosDesdeExcel(productosValidos);
        } else {
          Swal.fire(
            'Archivo inválido',
            'No se encontraron productos válidos para actualizar.',
            'warning'
          );
        }
      }
    };

    lector.readAsArrayBuffer(archivo);
  }

  parsearPrecio(valor: any): number | null {
    if (typeof valor === 'string') {
      const valorParseado = parseFloat(valor.replace(',', '.'));
      return isNaN(valorParseado) ? null : valorParseado;
    }

    if (typeof valor === 'number') {
      if (valor > 40000) {
        return null;
      }
      return valor;
    }

    return null;
  }

  actualizarProductosDesdeExcel(productos: any[]): void {
    const productosValidos = productos.filter(
      (p) =>
        p.codigoBarra &&
        (typeof p.precio === 'number' || typeof p.cantidadStock === 'number')
    );

    if (productosValidos.length === 0) {
      Swal.fire(
        'Archivo inválido',
        'No se encontraron productos válidos para actualizar.',
        'warning'
      );
      return;
    }

    this.productoService.actualizarMasivoProductos(productosValidos).subscribe({
      next: () => {
        Swal.fire(
          'Actualización exitosa',
          'Se actualizaron los productos correctamente.',
          'success'
        );
        this.cargarDatosIniciales();
      },
      error: (err) => {
        console.error('Error del backend:', err);
        Swal.fire(
          'Error',
          'Ocurrió un error al actualizar productos.',
          'error'
        );
      },
    });
  }

  cargarDatosIniciales(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      forkJoin({
        productos: this.productoService.obtenerTodosLosProductos(),
        categorias: this.categoriaService.obtenerTodasLasCategorias(),
        proveedores:
          this.productoService.obtenerProveedoresActivosPorSucursal(sucursalId),
      }).subscribe({
        next: ({ productos, categorias, proveedores }) => {
          this.categorias = categorias.filter(
            (cat) => cat.sucursalId === sucursalId
          );
          this.proveedores = proveedores;
          const categoriaRequests: Observable<any>[] = productos.map((prod) =>
            prod.categoriaId
              ? this.productoService.obtenerCategoriaPorId(prod.categoriaId)
              : of({ nombre: 'Sin Categoría' })
          );
          forkJoin(categoriaRequests).subscribe({
            next: (categoriaResponses) => {
              productos.forEach((prod, index) => {
                prod.categoriaNombre = categoriaResponses[index].nombre;
                prod.proveedorNombres = prod.proveedorIds
                  ? prod.proveedorIds.map((id) => {
                      const proveedor = this.proveedores.find(
                        (p) => p.id === id
                      );
                      return proveedor ? proveedor.nombre : 'Desconocido';
                    })
                  : [];
                // Sanitize imagen to prevent invalid base64
                if (prod.imagen && !this.isValidBase64Image(prod.imagen)) {
                  console.warn(
                    `Invalid imagen for product ${prod.id}: ${prod.imagen}`
                  );
                  prod.imagen = null;
                }
              });
              this.productos = productos.filter(
                (prod) => prod.sucursalId === sucursalId
              );
            },
            error: () => {
              Swal.fire(
                'Error',
                'No se pudieron cargar las categorías',
                'error'
              );
            },
          });
        },
        error: () => {
          Swal.fire(
            'Error',
            'No se pudieron cargar los datos iniciales',
            'error'
          );
        },
      });
    } else {
      this.productos = [];
      this.categorias = [];
      this.proveedores = [];
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
    }
  }

  isValidBase64Image(imagen: string): boolean {
    if (
      !imagen ||
      !imagen.startsWith('data:image/') ||
      !imagen.includes('base64,')
    ) {
      return false;
    }
    try {
      const base64Data = imagen.split(',')[1];
      if (!base64Data) return false;
      atob(base64Data);
      return true;
    } catch (e) {
      return false;
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
    this.productoSeleccionado = {
      ...prod,
      proveedorIds: prod.proveedorIds || [],
    };
    this.mostrarCamara = false;
    this.mostrarModal('productoModal');
  }

  abrirModalAgregarLote(prod: Producto): void {
    this.loteSeleccionado = this.resetLote();
    this.loteSeleccionado.productoId = prod.id;
    this.mostrarModal('loteModal');
  }

  guardarLote(): void {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById('loteModal')
    );
    if (
      !this.loteSeleccionado.numeroLote ||
      !this.loteSeleccionado.fechaIngreso
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El número de lote y la fecha de ingreso son obligatorios',
      });
      return;
    }
    if (
      this.loteSeleccionado.cantidadStock == null ||
      this.loteSeleccionado.cantidadStock < 0
    ) {
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
      activo: true,
    };

    this.loteService.agregarLote(loteData).subscribe({
      next: () => {
        modal.hide();
        Swal.fire({
          icon: 'success',
          title: 'Lote agregado',
          text: 'El lote ha sido agregado correctamente',
          timer: 1500,
          showConfirmButton: false,
        });
        this.cargarDatosIniciales();
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'Error al agregar el lote';
        if (error.status === 403) {
          errorMessage =
            'Acceso denegado. Por favor, inicia sesión nuevamente.';
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
      },
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
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const productoActualizado = { ...prod, activo: nuevoEstado };
        this.productoService.actualizarProducto(productoActualizado).subscribe({
          next: () => {
            Swal.fire('Éxito', `Producto ${accion}o correctamente`, 'success');
            this.cargarDatosIniciales();
          },
          error: (err: HttpErrorResponse) => {
            Swal.fire(
              'Error',
              err.error.message || `No se pudo ${accion} el producto`,
              'error'
            );
          },
        });
      }
    });
  }

  guardarProducto(): void {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById('productoModal')
    );
    if (
      !this.productoSeleccionado.nombre ||
      !this.productoSeleccionado.codigoBarra ||
      this.productoSeleccionado.categoriaId === 0 ||
      this.productoSeleccionado.precio < 0 ||
      this.productoSeleccionado.cantidadStock < 0
    ) {
      Swal.fire(
        'Error',
        'Por favor completa todos los campos requeridos correctamente',
        'error'
      );
      return;
    }
    if (this.productoSeleccionado.imagen) {
      if (!this.isValidBase64Image(this.productoSeleccionado.imagen)) {
        Swal.fire(
          'Error',
          'El formato de la imagen no es válido o los datos base64 son incorrectos',
          'error'
        );
        return;
      }
      try {
        const base64Data = this.productoSeleccionado.imagen.split(',')[1];
        const imgSizeBytes = atob(base64Data).length;
        if (imgSizeBytes > 1_000_000) {
          Swal.fire('Error', 'La imagen no debe exceder 1MB', 'error');
          return;
        }
      } catch (e) {
        Swal.fire(
          'Error',
          'No se pudo procesar la imagen: formato base64 inválido',
          'error'
        );
        return;
      }
    }
    const productoToSave = { ...this.productoSeleccionado };
    if (this.esEditar) {
      this.productoService.actualizarProducto(productoToSave).subscribe({
        next: () => {
          modal.hide();
          Swal.fire(
            'Actualizado',
            'El producto ha sido actualizado',
            'success'
          );
          this.cargarDatosIniciales();
          this.cerrarCamara();
        },
        error: (err: HttpErrorResponse) => {
          let errorMessage = 'No se pudo actualizar el producto';
          if (err.status === 400) {
            errorMessage = err.error || 'Error en los datos proporcionados';
          } else if (err.status === 403) {
            errorMessage =
              'Acceso denegado. Por favor, inicia sesión nuevamente.';
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
        },
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
          let errorMessage = 'No se pudo agregar el producto';
          if (err.status === 400) {
            errorMessage = err.error || 'Error en los datos proporcionados';
          } else if (err.status === 403) {
            errorMessage =
              'Acceso denegado. Por favor, inicia sesión nuevamente.';
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
        },
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
      imagen: null,
      nombre: '',
      detalle: '',
      precio: 0,
      cantidadStock: 0,
      sucursalId: this.authService.getSucursalId() || 0,
      categoriaId: 0,
      activo: true,
      proveedorIds: [],
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
      productoId: null,
    };
  }

  filtrarProductos(): Producto[] {
    return this.productos
      .filter(
        (prod) =>
          prod.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
          prod.detalle.toLowerCase().includes(this.filtro.toLowerCase()) ||
          prod.codigoBarra.includes(this.filtro) ||
          prod.id.toString().includes(this.filtro) ||
          (prod.categoriaNombre &&
            prod.categoriaNombre
              .toLowerCase()
              .includes(this.filtro.toLowerCase())) ||
          (prod.proveedorNombres &&
            prod.proveedorNombres.some((nombre) =>
              nombre.toLowerCase().includes(this.filtro.toLowerCase())
            ))
      )
      .sort((a, b) => a.id - b.id);
  }

  obtenerProductosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.filtrarProductos().slice(
      inicio,
      inicio + this.elementosPorPagina
    );
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
        if (!this.isValidBase64Image(imageData)) {
          Swal.fire(
            'Error',
            'La imagen debe ser un formato de imagen válido en base64',
            'error'
          );
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
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            if (this.videoElement) {
              this.videoElement.srcObject = stream;
            }
          })
          .catch((err) => {
            Swal.fire(
              'Error',
              'No se pudo acceder a la cámara: ' + err.message,
              'error'
            );
            this.mostrarCamara = false;
          });
      } else {
        Swal.fire(
          'Error',
          'La API de la cámara no está soportada en este navegador',
          'error'
        );
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
        if (!this.isValidBase64Image(imageData)) {
          Swal.fire(
            'Error',
            'La imagen capturada tiene un formato inválido',
            'error'
          );
          return;
        }
        try {
          const imgSizeBytes = atob(imageData.split(',')[1]).length;
          if (imgSizeBytes > 1_000_000) {
            Swal.fire(
              'Error',
              'La imagen capturada no debe exceder 1MB',
              'error'
            );
            return;
          }
          this.productoSeleccionado.imagen = imageData;
          this.cerrarCamara();
        } catch (e) {
          Swal.fire(
            'Error',
            'No se pudo procesar la imagen capturada: formato base64 inválido',
            'error'
          );
          return;
        }
      }
    }
  }

  cerrarCamara(): void {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
    this.mostrarCamara = false;
  }
}
