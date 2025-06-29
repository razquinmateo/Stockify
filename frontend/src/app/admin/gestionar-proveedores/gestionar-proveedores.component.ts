import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProveedorService, Proveedor, SucursalProveedor } from '../../services/proveedor.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './gestionar-proveedores.component.html',
  styleUrls: ['./gestionar-proveedores.component.css']
})
export class GestionarProveedoresComponent implements OnInit {
  @ViewChild('fileInputProv') fileInputProv!: ElementRef<HTMLInputElement>;

  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor = this.resetProveedor();
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  esEditar: boolean = false;
  filtro: string = '';
  filtroProductos: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 10;
  maxPaginasMostradas: number = 5;
  nombreUsuarioLogueado: string = '';
  // Array donde se almacenan los datos limpios del Excel de proveedores
  proveedoresExcel: {
    nombre: string;
    nombreVendedor: string;
    rut: string;
    telefono: string;
  }[] = [];


  constructor(
    private proveedorService: ProveedorService,
    private productoService: ProductoService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      forkJoin({
        //proveedores: this.proveedorService.obtenerProveedoresPorSucursal(sucursalId),
        proveedores: this.proveedorService.obtenerProveedores(),
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

  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(hoja, { defval: null });

      // Normalizar claves y limpiar datos para proveedores
      this.proveedoresExcel = raw
        .map((row: any) => {
          const prov: any = {};

          for (const clave in row) {
            const valor = row[clave];
            const claveLower = clave.toLowerCase().trim();

            // Nombre del proveedor
            if (['nombre'].includes(claveLower)) {
              prov.nombre = String(valor ?? '').trim();
            }
            // Direccion del proveedor
            else if (['direccion', 'dirección', 'address'].includes(claveLower)) {
              prov.direccion = String(valor ?? '').trim();
            }
            // Nombre del vendedor
            else if (['nombre_vendedor', 'nombre vendedor', 'vendedor'].includes(claveLower)) {
              prov.nombreVendedor = String(valor ?? '').trim();
            }
            // RUT
            else if (['rut'].includes(claveLower)) {
              prov.rut = String(valor ?? '').trim();
            }
            // Teléfono
            else if (['telefono', 'teléfono', 'phone'].includes(claveLower)) {
              prov.telefono = String(valor ?? '').trim();
            }
            // puedes añadir más variantes si las cabeceras cambian
          }

          return prov;
        })
        .filter(p => p.rut && p.nombre);
      // Sólo filas con todos los campos obligatorios
      /*.filter(p =>
        p.nombre &&
        p.direccion &&
        p.nombreVendedor &&
        p.rut &&
        p.telefono
      );*/

      // Llama a tu manejador de importación y resetea el input
      this._handleExcelProveedores();
      this.fileInputProv.nativeElement.value = '';
    };
    lector.readAsArrayBuffer(archivo);
  }


  private _handleExcelProveedores(): void {
    // 1) Descarga la lista actual de proveedores activos
    this.proveedorService.obtenerProveedores()
      .subscribe({
        next: current => {
          this.proveedores = current;

          // 2) Limpieza de RUT para comparar sin guiones, puntos ni mayúsculas
          const cleanRut = (rut: string) =>
            rut.toLowerCase().replace(/[^0-9kK]/g, '').trim();

          const rutsExistentes = this.proveedores.map(p => cleanRut(p.rut));

          // 3) Detectar sólo los nuevos
          const faltantes = this.proveedoresExcel.filter(ep =>
            !rutsExistentes.includes(cleanRut(ep.rut))
          );

          if (!faltantes.length) {
            Swal.fire('Info', 'Todos los proveedores ya existen.', 'info');
            return;
          }

          // 4) Mostrar lista y pedir confirmación
          const listaHtml = faltantes
            .map(p => `<li>${p.nombre} – ${p.rut}</li>`)
            .join('');

          Swal.fire({
            title: 'Proveedores nuevos detectados',
            html: `
            <p>Se encontraron ${faltantes.length} proveedores nuevos:</p>
            <ul style="text-align:left">${listaHtml}</ul>
          `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Crear proveedores'
          }).then(res => {
            if (!res.isConfirmed) return;

            // 5) Crear cada uno en paralelo
            const calls = faltantes.map(p => {
              const dto: any = {
                id: 0,
                nombre: p.nombre,
                nombreVendedor: p.nombreVendedor,
                rut: p.rut,
                telefono: p.telefono,
                activo: true
              };
              return this.proveedorService.crearProveedor(dto)
                .pipe(catchError(() => of(null)));
            });

            // 6) Ejecutar y recargar la tabla al terminar
            forkJoin(calls).subscribe(results => {
              const exitosos = results.filter(r => r != null).length;
              Swal.fire('Hecho', `Se crearon ${exitosos} proveedores.`, 'success');
              // recarga final
              this.proveedorService.obtenerProveedores()
                .subscribe(data => this.proveedores = data);
            });
          });
        },
        error: err => {
          console.error('Error cargando proveedores', err);
          Swal.fire('Error', 'No se pudieron leer los proveedores actuales.', 'error');
        }
      });
  }
  downloadPlantilla(): void {
    // Creamos un libro nuevo
    const wb = XLSX.utils.book_new();
    // Definimos la hoja con sólo una fila de encabezados para proveedores
    const ws = XLSX.utils.aoa_to_sheet([[
      'nombre', 'direccion', 'nombre_vendedor', 'rut', 'telefono'
    ]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
    // Ajustamos anchos de columna
    (ws['!cols'] as any) = [
      { wch: 20 },  // nombre
      { wch: 30 },  // direccion
      { wch: 25 },  // nombre_vendedor
      { wch: 15 },  // rut
      { wch: 15 }   // telefono
    ];
    // Generamos el binario en formato XLS
    const wbout = XLSX.write(wb, { bookType: 'xls', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.ms-excel' });
    // Forzamos la descarga
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_proveedores.xls';
    a.click();
    window.URL.revokeObjectURL(url);
  }

}