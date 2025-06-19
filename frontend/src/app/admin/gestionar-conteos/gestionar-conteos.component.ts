import { Router } from "@angular/router";
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ConteoService, Conteo } from "../../services/conteo.service";
import { UsuarioService, Usuario } from "../../services/usuario.service";
import { AuthService } from "../../auth.service";
import { ConteoProductoService, ConteoProducto } from "../../services/conteo-producto.service";
import { ProductoService, Producto } from "../../services/producto.service";
import { CategoriaService, Categoria } from "../../services/categoria.service";
import Swal from "sweetalert2";
import { formatDate } from "@angular/common";
import { lastValueFrom, retry, delay } from "rxjs";
import { UsuarioDto } from '../../models/usuario-dto';

interface RegistroConteo {
  productoId: number;
  nombre: string;
  cantidadEsperada: number;
  cantidadContada: number | null;
  usuario: string;
  usuarioId: number;
  codigosBarra: string[];
  categoriaNombre?: string;
}

@Component({
  selector: "app-gestionar-conteos",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./gestionar-conteos.component.html",
  styleUrls: ["./gestionar-conteos.component.css"],
})
export class GestionarConteosComponent implements OnInit {
  conteos: Conteo[] = [];
  usuarios: Usuario[] = [];
  usuariosMismaSucursal: Usuario[] = [];
  usuariosPorConteo: { [conteoId: number]: UsuarioDto[] } = {};
  participantesSeleccionados: UsuarioDto[] = [];
  mostrarModalParticipantes: boolean = false;
  mostrarModalTipoConteo: boolean = false;
  mostrarModalCategorias: boolean = false;
  categoriasSeleccionadas: { [key: number]: boolean } = {};
  conteoSeleccionado: Conteo = this.resetConteo();
  esEditar: boolean = false;
  filtro: string = "";
  paginaActual: number = 1;
  conteosPorPagina: number = 5;
  nombreUsuarioLogueado: string = "";
  usuarioId: number | null = null;
  conteoActual: Conteo | null = null;
  productosConteo: ConteoProducto[] = [];
  allProductos: Producto[] = [];
  allCategorias: Categoria[] = [];
  registros: RegistroConteo[] = [];
  private readonly STORAGE_KEY = 'conteoActivoRecibido';
  private readonly REGISTROS_KEY: string;
  private productCache: Map<number, Producto> = new Map();
  private categoryCache: Map<number, Categoria> = new Map();

  constructor(
    private conteoService: ConteoService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private conteoProductoService: ConteoProductoService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router
  ) {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.REGISTROS_KEY = `registros_${this.nombreUsuarioLogueado}`;
  }

  ngOnInit(): void {
    this.conteoSeleccionado = this.resetConteo();
    // Obtener el ID del usuario logueado para asignación automática
    this.authService.getUsuarioIdDesdeToken().subscribe({
      next: (id) => {
        this.usuarioId = id;
        this.loadInitialData();
      },
      error: (err) => {
        console.error("Error al obtener ID del usuario logueado", err);
        Swal.fire('Error', 'No se pudo identificar al usuario logueado', 'error');
      }
    });
  }

  private loadInitialData(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        const sucursalId = this.authService.getSucursalId();
        this.usuariosMismaSucursal = this.usuarios.filter(
          (u) => u.sucursalId === sucursalId && u.rol === 'ADMINISTRADOR'
        );
        this.cargarCategorias();
        this.cargarProductos();
        this.cargarConteos();
      },
      error: (err) => console.error("Error al cargar usuarios", err),
    });
  }

  private cargarCategorias(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId == null) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      return;
    }
    this.categoriaService.obtenerCategoriasPorSucursal(sucursalId).subscribe({
      next: (categorias) => {
        this.allCategorias = categorias;
        categorias.forEach(cat => this.categoryCache.set(cat.id, cat));
      },
      error: (err) => {
        console.error('Error loading categorias:', err);
        Swal.fire('Error', 'No se pudo cargar las categorías', 'error');
      }
    });
  }

  private cargarProductos(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId == null) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      return;
    }
    this.productoService.obtenerProductosActivosPorSucursal(sucursalId).subscribe({
      next: prods => {
        this.allProductos = prods.sort((a, b) => a.id - b.id);
        prods.forEach(prod => this.productCache.set(prod.id, prod));
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el catálogo de productos activos de la sucursal', 'error')
    });
  }

  cargarConteos(): void {
    const sucursalId = this.authService.getSucursalId();
    this.conteoService.obtenerTodosLosConteos().subscribe({
      next: (data) => {
        const usuariosMismaSucursal = this.usuarios.filter(
          (u) => u.sucursalId === sucursalId
        );
        const idsUsuarios = usuariosMismaSucursal.map((u) => u.id);
        this.conteos = data.filter((c) => idsUsuarios.includes(c.usuarioId));
        for (const conteo of this.conteos) {
          this.conteoService.obtenerUsuariosPorConteo(conteo.id).subscribe({
            next: (usuarios) => {
              this.usuariosPorConteo[conteo.id] = usuarios;
            },
            error

              : (err) => {
                console.error(`Error al obtener usuarios del conteo ${conteo.id}`, err);
              },
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los conteos. Inténtalo de nuevo.",
        });
      },
    });
  }

  private async loadConteoProductos(conteoId: number): Promise<void> {
    try {
      const productos = await lastValueFrom(this.conteoProductoService.getConteoProductosByConteoId1(conteoId));
      this.productosConteo = productos;
      this.updateRegistros();
    } catch (err) {
      console.error('Error loading conteoProductos:', err);
      Swal.fire('Error', 'No se pudieron cargar los productos del conteo', 'error');
    }
  }

  private updateRegistros(): void {
    this.registros = [];
    for (const cp of this.productosConteo) {
      const prod = this.productCache.get(cp.productoId);
      if (!prod) continue;
      const cat = this.categoryCache.get(prod.categoriaId);
      const reg: RegistroConteo = {
        productoId: cp.productoId,
        nombre: prod.nombre,
        cantidadEsperada: cp.cantidadEsperada,
        cantidadContada: cp.cantidadContada,
        usuario: this.nombreUsuarioLogueado,
        usuarioId: this.usuarioId!,
        codigosBarra: prod.codigosBarra,
        categoriaNombre: cat?.nombre || 'Sin Categoría'
      };
      this.registros.push(reg);
    }
  }

  get productosNoContados(): { id: number; nombre: string; codigosBarra: string[]; categoriaNombre: string }[] {
    return this.productosConteo
      .filter(p => p.cantidadContada === null)
      .map(p => {
        const producto = this.productCache.get(p.productoId);
        const categoria = producto ? this.categoryCache.get(producto.categoriaId) : null;
        return {
          id: p.productoId,
          nombre: producto?.nombre || 'Desconocido',
          codigosBarra: producto?.codigosBarra || [],
          categoriaNombre: categoria?.nombre || 'Sin Categoría'
        };
      })
      .sort((a, b) => a.categoriaNombre.localeCompare(b.categoriaNombre) || a.nombre.localeCompare(b.nombre));
  }

  obtenerNombresUsuarios(conteoId: number): string {
    const usuarios = this.usuariosPorConteo[conteoId];
    return usuarios && usuarios.length > 0
      ? usuarios.map(u => u.nombre).join(', ')
      : 'Sin usuarios';
  }

  hayConteoActivoEnSucursal(): boolean {
    const sucursalId = this.authService.getSucursalId();
    return this.conteos.some((c) => {
      const usuario = this.usuarios.find((u) => u.id === c.usuarioId);
      return usuario?.sucursalId === sucursalId && !c.conteoFinalizado;
    });
  }

  getNombreUsuarioPorId(id: number): string {
    const usuario = this.usuarios.find((u) => u.id === id);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : "";
  }

  getTipoConteoDisplay(tipoConteo: string): string {
    return tipoConteo === 'CATEGORIAS' ? 'Por rubro' : 'Libre';
  }

  resetConteo(): Conteo {
    return {
      id: 0,
      fechaHora: "",
      conteoFinalizado: false,
      usuarioId: 0,
      activo: true,
      tipoConteo: 'LIBRE',
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  abrirModalTipoConteo(): void {
    this.mostrarModalTipoConteo = true;
  }

  cerrarModalTipoConteo(): void {
    this.mostrarModalTipoConteo = false;
  }

  abrirModalSeleccionCategorias(): void {
    this.cerrarModalTipoConteo();
    this.mostrarModalCategorias = true;
    this.categoriasSeleccionadas = {};
    this.conteoSeleccionado = this.resetConteo();
    this.conteoSeleccionado.tipoConteo = 'CATEGORIAS';
  }

  cerrarModalCategorias(): void {
    this.mostrarModalCategorias = false;
    this.categoriasSeleccionadas = {};
  }

  categoriasSeleccionadasValidas(): boolean {
    return Object.values(this.categoriasSeleccionadas).some(selected => selected);
  }

  crearConteoLibre(): void {
    if (!this.usuarioId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar al usuario logueado.',
      });
      return;
    }
    const fechaHoraLocal = new Date()
      .toLocaleString('sv-SE', { timeZone: 'America/Montevideo' })
      .replace(' ', 'T');
    const nuevoConteo: Partial<Conteo> = {
      fechaHora: fechaHoraLocal,
      conteoFinalizado: false,
      usuarioId: this.usuarioId,
      activo: true,
      tipoConteo: 'LIBRE',
    };
    this.conteoService.createConteoLibre(nuevoConteo).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Conteo iniciado',
          text: 'Se ha iniciado un nuevo conteo de tipo Libre correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.cerrarModalTipoConteo();
        this.cargarConteos();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo iniciar el conteo. Inténtalo de nuevo.',
        });
      },
    });
  }

  crearConteoCategorias(): void {
    if (!this.usuarioId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar al usuario logueado.',
      });
      return;
    }
    const fechaHoraLocal = new Date()
      .toLocaleString('sv-SE', { timeZone: 'America/Montevideo' })
      .replace(' ', 'T');
    const categoriaIds = Object.keys(this.categoriasSeleccionadas)
      .filter(id => this.categoriasSeleccionadas[+id])
      .map(id => +id);
    const nuevoConteo: Partial<Conteo> = {
      fechaHora: fechaHoraLocal,
      conteoFinalizado: false,
      usuarioId: this.usuarioId,
      activo: true,
      tipoConteo: 'CATEGORIAS',
      categoriaIds: categoriaIds,
    };
    this.conteoService.createConteoCategorias(nuevoConteo).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Conteo iniciado',
          text: 'Se ha iniciado un nuevo conteo por categorías correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.cerrarModalCategorias();
        this.cargarConteos();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo iniciar el conteo. Inténtalo de nuevo.',
        });
      },
    });
  }

  abrirModalParticipantes(conteoId: number): void {
    this.participantesSeleccionados = this.usuariosPorConteo[conteoId] || [];
    this.mostrarModalParticipantes = true;
  }

  cerrarModalParticipantes(): void {
    this.mostrarModalParticipantes = false;
    this.participantesSeleccionados = [];
  }

  async alternarEstadoConteo(conteo: Conteo): Promise<void> {
    const esFinalizado = conteo.conteoFinalizado;
    if (esFinalizado && this.hayConteoActivoEnSucursal()) {
      Swal.fire({
        icon: 'warning',
        title: 'Ya hay un conteo activo',
        text: 'No se puede reactivar este conteo porque ya hay otro activo en la sucursal.',
      });
      return;
    }
    if (!esFinalizado && conteo.tipoConteo === 'LIBRE') {
      await this.finalizarConteoLibre(conteo);
    } else if (!esFinalizado && conteo.tipoConteo === 'CATEGORIAS') {
      await this.finalizarConteoCategorias(conteo);
    } else {
      Swal.fire({
        title: '¿Reactivar conteo?',
        text: 'El conteo volverá a estar activo.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          conteo.conteoFinalizado = false;
          this.conteoService.update(conteo.id, conteo).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Conteo reactivado',
                text: 'El conteo ha sido reactivado correctamente.',
                timer: 2000,
                showConfirmButton: false,
              });
              this.cargarConteos();
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el estado del conteo.',
              });
            },
          });
        }
      });
    }
  }

  private async finalizarConteoLibre(conteo: Conteo): Promise<void> {
    this.conteoActual = conteo;
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId == null) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      return;
    }

    try {
      // Cargar productos del conteo
      await this.loadConteoProductos(conteo.id);

      // Obtener todos los productos activos de la sucursal
      const productosSucursal = await lastValueFrom(
        this.productoService.obtenerProductosActivosPorSucursal(sucursalId)
      );

      // Identificar productos no contados comparando con los productos del conteo
      const productosConteoIds = new Set(this.productosConteo.map(p => p.productoId));
      const productosNoContados = productosSucursal
        .filter(prod => !productosConteoIds.has(prod.id))
        .map(prod => {
          const categoria = this.categoryCache.get(prod.categoriaId);
          return {
            id: prod.id,
            nombre: prod.nombre,
            categoriaNombre: categoria?.nombre || 'Sin Categoría'
          };
        })
        .sort((a, b) => a.categoriaNombre.localeCompare(b.categoriaNombre) || a.nombre.localeCompare(b.nombre));

      // Añadir productos no contados a la lista de productosConteo con cantidadContada = null
      for (const prod of productosNoContados) {
        const nuevo: Partial<ConteoProducto> = {
          conteoId: conteo.id,
          productoId: prod.id,
          cantidadEsperada: this.productCache.get(prod.id)?.cantidadStock ?? 0,
          cantidadContada: null,
          precioActual: this.productCache.get(prod.id)?.precio ?? 0,
          activo: true
        };
        this.productosConteo.push(nuevo as ConteoProducto);
      }

      // Verificar si hay productos sin contar
      if (productosNoContados.length === 0) {
        Swal.fire({
          title: '¿Finalizar conteo?',
          text: 'El conteo será finalizado. Todos los productos han sido contados.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, finalizar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.conteoService.update(this.conteoActual!.id, { conteoFinalizado: true }).subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Conteo finalizado',
                  text: 'El conteo ha sido marcado como finalizado correctamente.',
                  timer: 2000,
                  showConfirmButton: false
                });
                this.clearStorage();
                this.cargarConteos();
              },
              error: (err) => {
                if (err.status === 403) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Permiso denegado',
                    text: 'No tienes permisos para finalizar este conteo. Contacta al administrador.'
                  });
                } else {
                  Swal.fire('Error', 'No se pudo finalizar el conteo', 'error');
                }
              }
            });
          }
        });
      } else {
        const tablaProductos = productosNoContados
          .map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.nombre}</td>
            </tr>
          `)
          .join('');

        Swal.fire({
          title: '¿Finalizar conteo con productos sin contar?',
          html: `
            <style>
              .table-container {
                max-height: 400px;
                overflow-y: auto;
                margin-bottom: 1rem;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                min-width: 600px;
                table-layout: fixed;
              }
              th, td {
                padding: 8px;
                border: 1px solid #dee2e6;
                text-align: left;
                white-space: normal;
                word-wrap: break-word;
              }
              th:nth-child(1), td:nth-child(1) { width: 20%; }
              th:nth-child(2), td:nth-child(2) { width: 80%; }
              thead th {
                position: sticky;
                top: 0;
                background-color: #343a40;
                color: white;
                z-index: 2;
              }
            </style>
            <p>Hay <strong>${productosNoContados.length}</strong> producto(s) sin contar. Al finalizar, se registrarán con cantidad contada 0:</p>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  ${tablaProductos}
                </tbody>
              </table>
            </div>
            <p>¿Estás seguro de finalizar el conteo?</p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, finalizar',
          cancelButtonText: 'Cancelar',
          width: '80%'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              // Crear registros para los productos no contados con cantidad 0
              for (const prod of productosNoContados) {
                const nuevo: Partial<ConteoProducto> = {
                  conteoId: this.conteoActual!.id,
                  productoId: prod.id,
                  cantidadEsperada: this.productCache.get(prod.id)?.cantidadStock ?? 0,
                  cantidadContada: 0,
                  precioActual: this.productCache.get(prod.id)?.precio ?? 0,
                  activo: true
                };
                const item = await lastValueFrom(this.conteoProductoService.create(nuevo));
                this.productosConteo.push(item!);
                const reg: RegistroConteo = {
                  productoId: prod.id,
                  nombre: prod.nombre, // Corrección: Usar prod.nombre directamente
                  cantidadEsperada: nuevo.cantidadEsperada!,
                  cantidadContada: 0,
                  usuario: this.nombreUsuarioLogueado,
                  usuarioId: this.usuarioId!,
                  codigosBarra: this.productCache.get(prod.id)?.codigosBarra || [],
                  categoriaNombre: prod.categoriaNombre
                };
                this.registros.push(reg);
              }
              localStorage.setItem(this.REGISTROS_KEY, JSON.stringify(this.registros));

              // Finalizar el conteo
              this.conteoService.update(this.conteoActual!.id, { conteoFinalizado: true }).subscribe({
                next: () => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Conteo Finalizado',
                    text: `El conteo ha sido finalizado correctamente. Se crearon ${productosNoContados.length} registros con cantidad contada 0.`,
                    timer: 3000,
                    showConfirmButton: false
                  });
                  this.clearStorage();
                  this.cargarConteos();
                },
                error: (err) => {
                  if (err.status === 403) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Permiso denegado',
                      text: 'No tienes permisos para finalizar este conteo. Contacta al administrador.'
                    });
                  } else {
                    Swal.fire('Error', 'No se pudo finalizar el conteo.', 'error');
                  }
                }
              });
            } catch (err) {
              console.error('Error al crear ConteoProducto records:', err);
              Swal.fire('Error', 'No se pudieron crear los registros para los productos no contados', 'error');
            }
          }
        });
      }
    } catch (err) {
      console.error('Error al verificar productos de la sucursal:', err);
      Swal.fire('Error', 'No se pudo verificar los productos de la sucursal', 'error');
    }
  }

  private async finalizarConteoCategorias(conteo: Conteo): Promise<void> {
    this.conteoActual = conteo;
    await this.loadConteoProductos(conteo.id);
    const productosNoContados = this.productosNoContados;
    if (productosNoContados.length === 0) {
      Swal.fire({
        title: '¿Finalizar conteo?',
        text: 'El conteo será finalizado. Todos los productos han sido contados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.conteoService.update(this.conteoActual!.id, { conteoFinalizado: true }).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Conteo finalizado',
                text: 'El conteo ha sido marcado como finalizado correctamente.',
                timer: 2000,
                showConfirmButton: false
              });
              this.clearStorage();
              this.cargarConteos(); // Corrección: cargarConnteos -> cargarConteos
            },
            error: (err) => {
              if (err.status === 403) {
                Swal.fire({
                  icon: 'error',
                  title: 'Permiso denegado',
                  text: '使No tienes permisos para finalizar este conteo. Contacta al administrador.'
                });
              } else {
                Swal.fire('Error', 'No se pudo finalizar el conteo.', 'error');
              }
            }
          });
        }
      });
    } else {
      const tablaProductos = productosNoContados
        .map(p => `
          <tr>
            <td>${p.categoriaNombre}</td>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
          </tr>
        `)
        .join('');

      Swal.fire({
        title: '¿Finalizar conteo con productos sin contar?',
        html: `
          <style>
            .table-container {
              max-height: 400px;
              overflow-y: auto;
              margin-bottom: 1rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              min-width: 600px;
              table-layout: fixed;
            }
            th, td {
              padding: 8px;
              border: 1px solid #dee2e6;
              text-align: left;
              white-space: normal;
              word-wrap: break-word;
            }
            th:nth-child(1), td:nth-child(1) { width: 30%; min-width: 150px; }
            th:nth-child(2), td:nth-child(2) { width: 20%; }
            th:nth-child(3), td:nth-child(3) { width: 50%; min-width: 200px; }
            thead th {
              position: sticky;
              top: 0;
              background-color: #343a40;
              color: white;
              z-index: 2;
            }
          </style>
          <p>Hay <strong>${productosNoContados.length}</strong> producto(s) sin contar. Al finalizar, se registrarán con cantidad contada 0:</p>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>ID</th>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                ${tablaProductos}
              </tbody>
            </table>
          </div>
          <p>¿Estás seguro de finalizar el conteo?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar',
        width: '80%'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Mostrar modal de carga
          Swal.fire({
            title: 'Actualizando productos...',
            html: 'Por favor, espera mientras se actualizan los productos no contados.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          try {
            await this.updateUncountedProductsToZero();
            Swal.close(); // Cerrar el modal de carga

            this.conteoService.update(this.conteoActual!.id, { conteoFinalizado: true }).subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Conteo finalizado',
                  text: 'El conteo ha sido marcado como finalizado correctamente. Los productos no contados se registraron con cantidad 0.',
                  timer: 2000,
                  showConfirmButton: false
                });
                this.clearStorage();
                this.cargarConteos();
              },
              error: (err) => {
                Swal.close();
                if (err.status === 403) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Permiso denegado',
                    text: 'No tienes permisos para finalizar este conteo. Contacta al administrador.',
                  });
                } else {
                  Swal.fire('Error', 'No se pudo finalizar el conteo', 'error');
                }
              }
            });
          } catch (err) {
            Swal.close();
            Swal.fire('Error', 'No se pudo actualizar los productos no contados', 'error');
          }
        }
      });
    }
  }

  private async updateUncountedProductsToZero(): Promise<void> {
    const uncounted = this.productosConteo.filter(p => p.cantidadContada === null);
    if (uncounted.length === 0) return;

    const updates: Partial<ConteoProducto>[] = uncounted.map(item => ({
      id: item.id,
      cantidadContada: 0
    }));

    try {
      const updated = await lastValueFrom(
        this.conteoProductoService.batchUpdate(updates).pipe(retry(2), delay(500))
      );
      console.log(`Updated ${updated.length} uncounted products to cantidadContada: 0`);

      // Actualizar el estado local
      updated.forEach(updatedItem => {
        const item = this.productosConteo.find(p => p.id === updatedItem.id);
        if (item) {
          item.cantidadContada = updatedItem.cantidadContada;
          const reg = this.registros.find(r => r.productoId === item.productoId);
          if (reg) {
            reg.cantidadContada = 0;
          }
        }
      });

      localStorage.setItem(this.REGISTROS_KEY, JSON.stringify(this.registros));
    } catch (err) {
      console.error('Error updating uncounted products:', err);
      throw err;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REGISTROS_KEY);
  }

  verReporte(conteo: Conteo): void {
    if (conteo.activo) {
      Swal.fire({
        icon: 'warning',
        title: 'Conteo activo',
        text: 'El reporte solo está disponible para conteos inactivos.',
      });
      return;
    }
    this.router.navigate(['/admin/reporte-conteo', conteo.id]);
  }

  filtrarConteos(): Conteo[] {
    const filtroLower = this.filtro.toLowerCase();
    return this.conteos
      .filter((cont) => {
        const fechaFormateada = cont.fechaHora
          ? formatDate(cont.fechaHora, 'dd/MM/yyyy', 'en-US')
          : '';
        const nombreUsuario = this.getNombreUsuarioPorId(cont.usuarioId).toLowerCase(); // Corrección: cont.idUsuarioId -> cont.usuarioId
        const tipoConteo = this.getTipoConteoDisplay(cont.tipoConteo).toLowerCase();
        return (
          nombreUsuario.includes(filtroLower) ||
          fechaFormateada.toLowerCase().includes(filtroLower) ||
          tipoConteo.toLowerCase().includes(filtroLower)
        );
      })
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  }

  obtenerConteosPaginados(): Conteo[] {
    const inicio = (this.paginaActual - 1) * this.conteosPorPagina;
    return this.filtrarConteos().slice(inicio, inicio + this.conteosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.filtrarConteos().length / this.conteosPorPagina);
  }

  empezarConteo(): void {
    this.mostrarModalTipoConteo = true;
  }

  unirseConteo(): void {
    const sucursalId = this.authService.getSucursalId();
    const conteoActivo = this.conteos.find(c => {
      const usuario = this.usuarios.find(u => u.id === c.usuarioId);
      return usuario?.sucursalId === sucursalId && !c.conteoFinalizado;
    });
    if (conteoActivo) {
      const ruta = conteoActivo.tipoConteo === 'CATEGORIAS'
        ? '/admin/gestionar-conteos/unirse-conteo-categorias'
        : '/admin/gestionar-conteos/unirse-conteo-libre';
      this.router.navigate([ruta, conteoActivo.id]);
    } else {
      this.conteoService.getActiveConteos().subscribe({
        next: conteos => {
          const conteoActivoServicio = conteos.find(c => {
            const usuario = this.usuarios.find(u => u.id === c.usuarioId);
            return usuario?.sucursalId === sucursalId && !c.conteoFinalizado;
          });
          if (conteoActivoServicio) {
            const ruta = conteoActivoServicio.tipoConteo === 'CATEGORIAS'
              ? '/admin/gestionar-conteos/unirse-conteo-categorias'
              : '/admin/gestionar-conteos/unirse-conteo-libre';
            this.router.navigate([ruta, conteoActivoServicio.id]);
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'No hay conteo activo',
              text: 'No se encontró un conteo activo en tu sucursal.',
            });
          }
        },
        error: () => Swal.fire('Error', 'No se pudo verificar conteos activos', 'error')
      });
    }
  }
}