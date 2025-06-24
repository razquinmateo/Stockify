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

  // === onArchivoSeleccionado ===
  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      // 1) Normalizamos las filas del Excel
      const rows = raw.map(r => ({
        codigoProducto: r['CODIGO_PRODUCTO']?.toString().trim(),
        nombreProducto: r['NOMBRE_PRODUCTO']?.toString().trim(),
        idCat: r['ID_CAT']?.toString().trim(),              // string con ceros
        nombreCategoria: r['NOMBRE_CATEGORIA']?.toString().trim(),
        activoCategoria: r['ACTIVO']?.toString().toLowerCase().trim() === 'activo',
        activoProducto: r['ACTIVO']?.toString().toLowerCase().trim() === 'activo',
        precio: parseFloat(r['PRECIO']?.toString().replace(/[^0-9\.]/g, '')) || 0
      }));

      this.handleExcel(rows);
    };
    lector.readAsArrayBuffer(archivo);
  }


  // === handleExcel ===
  private handleExcel(rows: any[]) {
    const sucursalId = this.authService.getSucursalId()!;

    // 2) Extraer categorías únicas del Excel
    const excelCats = Array.from(
      new Map(rows.map(r => [r.idCat, r.nombreCategoria])).entries()
    ).map(([id_categoria, nombre]) => ({ id_categoria, nombre }));

    // 3) Detectar cuáles no existen aún
    const faltantes = excelCats.filter(ec =>
      !this.categorias.some(c => c.idCategoria === ec.id_categoria)
    );

    if (faltantes.length) {
      const lista = faltantes.map(c => `${c.id_categoria} – ${c.nombre}`).join('<br>');
      Swal.fire({
        title: 'Categorías nuevas detectadas',
        html: `Las siguientes no existen en BD:<br>${lista}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Crear categorías'
      }).then(res => {
        if (!res.isConfirmed) return;
        // 4) Crear categorías nuevas
        const calls = faltantes.map(c => {
          const dto = {
            id_categoria: c.id_categoria!,
            nombre: c.nombre,
            descripcion: '',
            sucursalId,
            activo: true
          };
          console.log('Creando categoría:', dto);
          return this.categoriaService.agregarCategoria(dto);
        });
        forkJoin(calls).subscribe({
          next: () => this._afterCategorias(rows),
          error: () => Swal.fire('Error', 'No se pudieron crear las categorías', 'error')
        });
      });
    } else {
      // Si no hay faltantes, seguimos
      this._afterCategorias(rows);
    }
  }


  // === _afterCategorias: insertar productos ===
  private _afterCategorias(rows: any[]) {
    // recargamos categorías para tener id_categoria actualizado
    const sucursalId = this.authService.getSucursalId()!;
    this.categoriaService.obtenerTodasLasCategorias().subscribe(allCats => {
      this.categorias = allCats.filter(c => c.sucursalId === sucursalId);

      // 5) Preparamos los productos nuevos
      const nuevos = rows.map(r => ({
        codigoProducto: r.codigoProducto,
        nombre: r.nombreProducto,
        codigosBarra: [r.codigoProducto],
        categoriaId: +r.idCat,
        activo: r.activo,
        precio: r.precio,
        cantidadStock: 0,      // cero, no null
        detalle: '',     // string vacío
        imagen: '',     // string vacío
        sucursalId
      }))
      // y opcionalmente filtrar duplicados con this.productos existentes…

      console.log('Productos a crear:', nuevos);

      // 6) Llamada al servicio
      this.productoService.crearProductosSimples(nuevos, sucursalId).subscribe({
        next: res => {
          console.log('Creados:', res);
          Swal.fire('Hecho', `Se crearon ${res.creados.length} productos.`, 'success');
          this.cargarDatosIniciales();
        },
        error: err => {
          console.error(err);
          Swal.fire('Error', 'No se pudieron crear los productos', 'error');
        }
      });
    });
  }

  parsearPrecio(valor: any): number | null {
    if (typeof valor === 'string') {
      // Eliminar separadores de miles (puntos)
      let limpio = valor.replace(/\./g, '');

      // Reemplazar coma decimal por punto
      limpio = limpio.replace(',', '.');

      const valorParseado = parseFloat(limpio);
      return isNaN(valorParseado) ? null : valorParseado;
    }

    if (typeof valor === 'number') {
      if (valor > 40000) return null;
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

    const sucursalId = this.authService.getSucursalId();

    if (sucursalId === null) {
      Swal.fire('Error', 'No se pudo obtener la sucursal del usuario.', 'error');
      return;
    }

    this.productoService.actualizarMasivoProductos(productosValidos, sucursalId).subscribe({
      next: async (respuesta) => {
        const noEncontrados = respuesta.noEncontrados || [];
        const actualizados = respuesta.actualizados || [];

        if (actualizados.length > 0) {
          await Swal.fire(
            'Actualización exitosa',
            `Se actualizaron ${actualizados.length} producto(s) correctamente.`,
            'success'
          );
        }

        if (noEncontrados.length > 0) {
          const mensaje =
            noEncontrados.length === 1
              ? 'No se encontró el siguiente código de barra en la base de datos:'
              : `No se encontraron los siguientes ${noEncontrados.length} códigos de barra en la base de datos:`;

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
            cancelButtonText: 'Ignorar'
          }).then(async result => {
            if (result.isConfirmed) {
              const codigosNoEncontradosSet = new Set(
                noEncontrados.map((c: string) => c.toString().trim())
              );

              // Detectar productos con precio inválido antes de filtrarlos
              const productosExcluidosPorPrecioInvalido = this.productosExcel.filter(p =>
                codigosNoEncontradosSet.has((p.codigoBarra ?? '').toString().trim()) &&
                (p.precio === null || typeof p.precio !== 'number' || isNaN(p.precio) || p.precio < 0)
              );

              if (productosExcluidosPorPrecioInvalido.length > 0) {
                const listaCodigos = productosExcluidosPorPrecioInvalido
                  .map(p => `<li>${p.codigoBarra}</li>`)
                  .join('');

                await Swal.fire({
                  icon: 'warning',
                  title: 'Productos ignorados por precio inválido',
                  html: `
                    <p>Se ignoraron ${productosExcluidosPorPrecioInvalido.length} producto(s) porque su precio tenía un formato inválido (probablemente una fecha).</p>
                    <p><b>Códigos de barra afectados:</b></p>
                    <ul style="text-align:left; max-height: 200px; overflow-y: auto;">
                      ${listaCodigos}
                    </ul>
                    <hr>
                    <p><b>Solución:</b> Verificá el archivo Excel y asegurate de que la columna de precios esté en formato <b>numérico</b>.</p>
                  `,
                  confirmButtonText: 'Entendido'
                });
              }

              // Filtrar productos válidos para agregar
              const productosFiltrados = this.productosExcel.filter((p) => {
                const codigoExcel = (p.codigoBarra ?? '').toString().trim();
                const estaNoEncontrado = codigosNoEncontradosSet.has(codigoExcel);

                const tieneNombre = typeof p.nombre === 'string' && p.nombre.trim().length > 0;
                const tieneCodigo = typeof p.codigoBarra === 'string' || typeof p.codigoBarra === 'number';
                const tienePrecio = p.precio !== null && typeof p.precio === 'number' && !isNaN(p.precio) && p.precio >= 0;
                const tieneStock = typeof p.cantidadStock === 'number' && !isNaN(p.cantidadStock);

                return estaNoEncontrado && tieneNombre && tieneCodigo && tienePrecio && tieneStock;
              });

              const productosParaAgregar = productosFiltrados.map((p) => ({
                nombre: p.nombre.trim(),
                codigoBarra: p.codigoBarra.toString().trim(),
                precio: p.precio,
                cantidadStock: p.cantidadStock,
                imagen: p.imagen ?? null,
                detalle: p.detalle ?? null
              }));

              if (productosParaAgregar.length === 0) {
                Swal.fire(
                  'Datos insuficientes',
                  'Ninguno de los productos no encontrados tiene todos los datos necesarios (nombre, código, precio y stock).',
                  'warning'
                );
                return;
              }

              const sucursalId = this.authService.getSucursalId();
              if (sucursalId === null) {
                Swal.fire('Error', 'No se pudo obtener la sucursal del usuario. Por favor, inicie sesión nuevamente.', 'error');
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
                  Swal.fire(
                    'Error',
                    'Ocurrió un error al agregar productos nuevos.',
                    'error'
                  );
                }
              });
            }
          });
        }

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
