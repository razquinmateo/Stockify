import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductoService, Producto, Proveedor } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { LoteService, Lote } from '../../services/lote.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './gestionar-productos.component.html',
  styleUrls: ['./gestionar-productos.component.css']
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
  elementosPorPagina: number = 10;
  maxPaginasMostradas: number = 5;
  nombreUsuarioLogueado: string = '';
  mostrarCamara: boolean = false;
  videoElement: HTMLVideoElement | null = null;
  canvas: HTMLCanvasElement = document.createElement('canvas');
  codigosBarraInput: string = '';
  productosExcel: any[] = [];

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

      // Normalizar claves y limpiar datos
      this.productosExcel = productosExcelRaw.map((prod: any) => {
        const productoNormalizado: any = {};

        for (const clave in prod) {
          const valor = prod[clave];
          const claveLower = clave.toLowerCase().trim();

          if (['codigoproducto', 'código producto', 'codigo producto', 'product code'].includes(claveLower)) {
            productoNormalizado.codigoProducto = String(valor).trim();
          } else if (['precio', 'precio unitario'].includes(claveLower)) {
            if (typeof valor === 'number' && valor > 40000) {
              detectoErrorFecha = true;
              productoNormalizado.precio = null;
            } else {
              const textoPrecio = String(valor).replace(',', '.');
              productoNormalizado.precio = parseFloat(textoPrecio);
            }
          } else if (['stock', 'cantidad', 'cantidad stock', 'existencia'].includes(claveLower)) {
            productoNormalizado.cantidadStock = typeof valor === 'number' ? valor : parseInt(valor, 10);
          } else if (['nombre', 'producto', 'descripcion'].includes(claveLower)) {
            productoNormalizado.nombre = String(valor).trim();
          } else if (['detalle', 'detalles', 'observaciones'].includes(claveLower)) {
            productoNormalizado.detalle = String(valor).trim();
          } else if (['codigo', 'código', 'código de barras', 'codigo de barras', 'barcode'].includes(claveLower)) {
            productoNormalizado.codigosBarra = String(valor)
              .split(',')
              .map((c: string) => c.trim())
              .filter((c: string) => c.length > 0);
          } else if (['categoria', 'idcategoria', 'categoría', 'id categoría', 'codigocategoria', 'código categoría', 'category code'].includes(claveLower)) {
            productoNormalizado.codigoCategoria = String(valor).trim();
          } else {
            productoNormalizado[claveLower] = valor;
          }
        }

        return productoNormalizado;
      });

      // Validar productos válidos
      const productosValidos = this.productosExcel.filter(
        (p) => p.codigoProducto && (typeof p.precio === 'number' || typeof p.cantidadStock === 'number')
      );

      // Mostrar alertas según corresponda
      if (detectoErrorFecha) {
        Swal.fire({
          icon: 'warning',
          title: 'Posible error en el archivo Excel',
          html: `
            <p>El archivo contiene valores que parecen <b>fechas</b> en la columna de <b>precios</b>.</p>
            <p><u>Estos precios serán ignorados.</u></p>
            <hr />
            <p><b>Solución:</b> Abre el archivo Excel, selecciona la columna de precios y cámbiala al formato <b>Texto</b>.</p>
          `,
          confirmButtonText: 'Entendido',
        }).then(() => {
          if (productosValidos.length > 0) {
            this.actualizarProductosDesdeExcel(productosValidos);
          } else {
            Swal.fire('Archivo inválido', 'No se encontraron productos válidos para actualizar.', 'warning');
          }
        });
      } else {
        if (productosValidos.length > 0) {
          this.actualizarProductosDesdeExcel(productosValidos);
        } else {
          Swal.fire('Archivo inválido', 'No se encontraron productos válidos para actualizar.', 'warning');
        }
      }
    };

    lector.readAsArrayBuffer(archivo);
  }

  actualizarProductosDesdeExcel(productos: any[]): void {
    const productosValidos = productos.filter(
      (p) => p.codigoProducto && (typeof p.precio === 'number' || typeof p.cantidadStock === 'number')
    );

    if (productosValidos.length === 0) {
      Swal.fire('Archivo inválido', 'No se encontraron productos válidos para actualizar.', 'warning');
      return;
    }

    const sucursalId = this.authService.getSucursalId();
    if (sucursalId === null) {
      Swal.fire('Error', 'No se pudo obtener la sucursal del usuario.', 'error');
      return;
    }

    // Fetch categoriaId for each product with a codigoCategoria
    const categoriaRequests = productosValidos.map(prod => {
      if (prod.codigoCategoria) {
        return this.productoService.obtenerCategoriaPorCodigoYSucursal(prod.codigoCategoria, sucursalId).pipe(
          map(categoria => ({ ...prod, categoriaId: categoria.id })),
          catchError(() => of({ ...prod, categoriaId: null })) // Fallback to null if category not found
        );
      }
      return of({ ...prod, categoriaId: null });
    });

    forkJoin(categoriaRequests).subscribe({
      next: (productosConCategoria) => {
        // Mapear productos al formato esperado por el backend
        const productosParaActualizar = productosConCategoria.map((p) => ({
          codigoProducto: p.codigoProducto,
          precio: p.precio,
          cantidadStock: p.cantidadStock,
          nombre: p.nombre ?? 'Producto sin nombre',
          codigosBarra: p.codigosBarra ?? [],
          imagen: p.imagen ?? null,
          detalle: p.detalle ?? null,
          categoriaId: p.categoriaId, // Include categoriaId if found
        }));

        this.productoService.actualizarMasivoProductos(productosParaActualizar, sucursalId).subscribe({
          next: async (respuesta) => {
            const noEncontrados = respuesta.noEncontrados || [];
            const actualizados = respuesta.actualizados || [];

            if (actualizados.length > 0) {
              await Swal.fire('Actualización exitosa', `Se actualizaron ${actualizados.length} producto(s) correctamente.`, 'success');
            }

            if (noEncontrados.length > 0) {
              const mensaje =
                noEncontrados.length === 1
                  ? 'No se encontró el siguiente código de producto en la base de datos:'
                  : `No se encontraron los siguientes ${noEncontrados.length} códigos de producto en la base de datos:`;

              Swal.fire({
                icon: 'warning',
                title: 'Productos no encontrados',
                html: `
                  <p>${mensaje}</p>
                  <div style="max-height: 200px; overflow-y: auto; text-align: left;">
                    <ul>
                      ${noEncontrados.map((c: string) => `<li>${c}</li>`).join('')}
                    </ul>
                  </div>
                  <hr/>
                  <p>¿Querés agregar automáticamente estos productos nuevos?</p>
                `,
                showCancelButton: true,
                confirmButtonText: 'Agregar productos',
                cancelButtonText: 'Ignorar',
              }).then(async (result) => {
                if (result.isConfirmed) {
                  const codigosNoEncontradosSet = new Set(noEncontrados.map((c: string) => c.toString().trim()));

                  // Detectar productos con precio inválido
                  const productosExcluidosPorPrecioInvalido = productosConCategoria.filter((p) =>
                    codigosNoEncontradosSet.has(p.codigoProducto.toString().trim()) &&
                    (p.precio === null || typeof p.precio !== 'number' || isNaN(p.precio) || p.precio < 0)
                  );

                  if (productosExcluidosPorPrecioInvalido.length > 0) {
                    const listaCodigos = productosExcluidosPorPrecioInvalido
                      .map((p) => `<li>${p.codigoProducto}</li>`)
                      .join('');

                    await Swal.fire({
                      icon: 'warning',
                      title: 'Productos ignorados por precio inválido',
                      html: `
                        <p>Se ignoraron ${productosExcluidosPorPrecioInvalido.length} producto(s) porque su precio tenía un formato inválido (probablemente una fecha).</p>
                        <p><b>Códigos de producto afectados:</b></p>
                        <ul style="text-align:left; max-height: 200px; overflow-y: auto;">
                          ${listaCodigos}
                        </ul>
                        <hr>
                        <p><b>Solución:</b> Verificá el archivo Excel y asegurate de que la columna de precios esté en formato <b>numérico</b>.</p>
                      `,
                      confirmButtonText: 'Entendido',
                    });
                  }

                  // Filtrar productos válidos para agregar
                  const productosFiltrados = productosConCategoria.filter((p) => {
                    const codigoNoEncontrado = codigosNoEncontradosSet.has(p.codigoProducto.toString().trim());
                    const tieneNombre = typeof p.nombre === 'string' && p.nombre.trim().length > 0;
                    const tieneCodigo = p.codigoProducto && p.codigoProducto.trim().length > 0;
                    const tienePrecio = p.precio !== null && typeof p.precio === 'number' && !isNaN(p.precio) && p.precio >= 0;
                    const tieneStock = typeof p.cantidadStock === 'number' && !isNaN(p.cantidadStock) && p.cantidadStock >= 0;

                    return codigoNoEncontrado && tieneNombre && tieneCodigo && tienePrecio && tieneStock;
                  });

                  const productosParaAgregar = productosFiltrados.map((p) => ({
                    nombre: p.nombre.trim(),
                    codigosBarra: p.codigosBarra ?? [],
                    precio: p.precio,
                    cantidadStock: p.cantidadStock,
                    imagen: p.imagen ?? null,
                    detalle: p.detalle ?? null,
                    codigoProducto: p.codigoProducto,
                    categoriaId: p.categoriaId, // Include categoriaId if found
                  }));

                  if (productosParaAgregar.length === 0) {
                    Swal.fire(
                      'Datos insuficientes',
                      'Ninguno de los productos no encontrados tiene todos los datos necesarios (nombre, código, precio y stock).',
                      'warning'
                    );
                    return;
                  }

                  this.productoService.crearProductosSimples(productosParaAgregar, sucursalId).subscribe({
                    next: (r) => {
                      const { creados, errores } = r;
                      let mensaje = `Se agregaron ${creados.length} producto(s) correctamente.`;
                      if (errores.length > 0) {
                        mensaje += `<br><br>Hubo ${errores.length} error(es):<ul>`;
                        mensaje += errores.map((e: string) => `<li>${e}</li>`).join('');
                        mensaje += '</ul>';
                      }

                      Swal.fire({
                        icon: 'info',
                        title: 'Resultado de la carga',
                        html: mensaje,
                      });

                      this.cargarDatosIniciales();
                    },
                    error: (err) => {
                      console.error('Error al agregar productos:', err);
                      Swal.fire('Error', 'Ocurrió un error al agregar productos nuevos.', 'error');
                    },
                  });
                }
              });
            }

            this.cargarDatosIniciales();
          },
          error: (err) => {
            console.error('Error del backend:', err);
            Swal.fire('Error', 'Ocurrió un error al actualizar productos.', 'error');
          },
        });
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
        Swal.fire('Error', 'No se pudieron obtener las categorías para los productos.', 'error');
      }
    });
  }

  cargarDatosIniciales(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      forkJoin({
        productos: this.productoService.obtenerTodosLosProductos(),
        categorias: this.categoriaService.obtenerTodasLasCategorias(),
        proveedores: this.productoService.obtenerProveedoresActivosPorSucursal(sucursalId)
      }).subscribe({
        next: ({ productos, categorias, proveedores }) => {
          this.categorias = categorias.filter(cat => cat.sucursalId === sucursalId);
          this.proveedores = proveedores;
          const categoriaRequests: Observable<any>[] = productos.map(prod =>
            prod.categoriaId
              ? this.productoService.obtenerCategoriaPorId(prod.categoriaId)
              : of({ nombre: 'Sin Categoría' })
          );
          forkJoin(categoriaRequests).subscribe({
            next: (categoriaResponses) => {
              productos.forEach((prod, index) => {
                prod.categoriaNombre = categoriaResponses[index].nombre;
                prod.proveedorNombres = prod.proveedorIds
                  ? prod.proveedorIds.map(id => {
                    const proveedor = this.proveedores.find(p => p.id === id);
                    return proveedor ? proveedor.nombre : 'Desconocido';
                  })
                  : [];
                if (prod.imagen && !this.isValidBase64Image(prod.imagen)) {
                  console.warn(`Invalid imagen for product ${prod.codigoProducto}: ${prod.imagen}`);
                  prod.imagen = null;
                }
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
      this.proveedores = [];
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
    }
  }

  isValidBase64Image(imagen: string): boolean {
    if (!imagen || !imagen.startsWith('data:image/') || !imagen.includes('base64,')) {
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
    this.codigosBarraInput = '';
    this.mostrarCamara = false;
    this.mostrarModal('productoModal');
  }

  editarProducto(prod: Producto): void {
    this.esEditar = true;
    this.productoSeleccionado = { ...prod, proveedorIds: prod.proveedorIds || [], codigosBarra: [...(prod.codigosBarra || [])] };
    this.codigosBarraInput = prod.codigosBarra.join('\n');
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
        this.cargarDatosIniciales();
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
    const codigos = this.codigosBarraInput
      .split(/[\n\s,]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (!this.productoSeleccionado.codigoProducto ||
      !this.productoSeleccionado.nombre ||
      codigos.length === 0 ||
      this.productoSeleccionado.categoriaId === 0 ||
      this.productoSeleccionado.precio < 0 ||
      this.productoSeleccionado.cantidadStock < 0) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos correctamente', 'error');
      return;
    }
    if (this.productoSeleccionado.imagen) {
      if (!this.isValidBase64Image(this.productoSeleccionado.imagen)) {
        Swal.fire('Error', 'El formato de la imagen no es válido o los datos base64 son incorrectos', 'error');
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
        Swal.fire('Error', 'No se pudo procesar la imagen: formato base64 inválido', 'error');
        return;
      }
    }

    const productoToSave = { ...this.productoSeleccionado, codigosBarra: codigos };
    const observable = this.esEditar
      ? this.productoService.actualizarProducto(productoToSave)
      : this.productoService.agregarProducto(productoToSave);

    observable.subscribe({
      next: () => {
        modal.hide();
        Swal.fire(
          this.esEditar ? 'Actualizado' : 'Agregado',
          `El producto ha sido ${this.esEditar ? 'actualizado' : 'agregado'}`,
          'success'
        );
        this.cargarDatosIniciales();
        this.cerrarCamara();
      },
      error: (err: HttpErrorResponse) => {
        console.log('Error del servidor:', err.status, err.error); // Para depuración
        let errorMessage = 'No se pudo ' + (this.esEditar ? 'actualizar' : 'agregar') + ' el producto';

        if (err.status === 400) {
          // manejamos errores
          errorMessage = typeof err.error === 'string' ? err.error : err.error?.message || 'Error en los datos proporcionados';
          if (errorMessage.includes('código de producto') || errorMessage.includes('ya está asignado')) {
            const inputElement = document.querySelector('input[ngModel="[productoSeleccionado.codigoProducto]"]') as HTMLInputElement;
            if (inputElement) {
              inputElement.classList.add('is-invalid');
              inputElement.focus();
              setTimeout(() => inputElement.classList.remove('is-invalid'), 3000);
            }
          }
        } else if (err.status === 403) {
          errorMessage = 'Algo salió mal. Por favor, revisa los datos e intenta de nuevo.';
        } else if (err.status === 404) {
          errorMessage = 'Recurso no encontrado';
        } else {
          errorMessage = err.error?.message || 'Algo salió mal. Por favor, revisa los datos e intenta de nuevo';
        }

        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }

  agregarCodigoBarra(): void {
    this.codigosBarraInput += '\n';
  }

  removerCodigoBarra(index: number): void {
    const codigos = this.codigosBarraInput
      .split(/[\n\s,]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    codigos.splice(index, 1);
    this.codigosBarraInput = codigos.join('\n');
  }

  mostrarModal(modalId: string): void {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  }

  resetProducto(): Producto {
    return {
      id: 0,
      codigoProducto: '',
      codigosBarra: [],
      imagen: null,
      nombre: '',
      detalle: '',
      precio: 0,
      cantidadStock: 0,
      sucursalId: this.authService.getSucursalId() || 0,
      categoriaId: 0,
      codigoCategoria: '',
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
      productoId: null
    };
  }

  filtrarProductos(): Producto[] {
    return this.productos
      .filter(prod =>
        prod.codigoProducto.toLowerCase().includes(this.filtro.toLowerCase()) ||
        prod.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
        prod.detalle.toLowerCase().includes(this.filtro.toLowerCase()) ||
        prod.codigosBarra.some(c => c.includes(this.filtro)) ||
        (prod.categoriaNombre && prod.categoriaNombre.toLowerCase().includes(this.filtro.toLowerCase())) ||
        (prod.proveedorNombres && prod.proveedorNombres.some(nombre => nombre.toLowerCase().includes(this.filtro.toLowerCase())))
      )
      .sort((a, b) => a.id - b.id);
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
        if (!this.isValidBase64Image(imageData)) {
          Swal.fire('Error', 'La imagen debe ser un formato de imagen válido en base64', 'error');
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
        if (!this.isValidBase64Image(imageData)) {
          Swal.fire('Error', 'La imagen capturada tiene un formato inválido', 'error');
          return;
        }
        try {
          const imgSizeBytes = atob(imageData.split(',')[1]).length;
          if (imgSizeBytes > 1_000_000) {
            Swal.fire('Error', 'La imagen capturada no debe exceder 1MB', 'error');
            return;
          }
          this.productoSeleccionado.imagen = imageData;
          this.cerrarCamara();
        } catch (e) {
          Swal.fire('Error', 'No se pudo procesar la imagen capturada: formato base64 inválido', 'error');
          return;
        }
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

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual = pagina;
    }
  }

  paginasMostradas(): number[] {
    const total = this.totalPaginas();
    const paginas: number[] = [];
    const rango = Math.floor(this.maxPaginasMostradas / 2);

    let inicio = Math.max(2, this.paginaActual - rango);
    let fin = Math.min(total - 1, this.paginaActual + rango);

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