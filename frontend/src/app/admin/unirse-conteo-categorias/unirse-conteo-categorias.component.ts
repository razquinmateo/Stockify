import {
    Component, OnInit, OnDestroy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { lastValueFrom, Subscription } from 'rxjs';
import { retry, delay } from 'rxjs/operators';

import { AuthService } from '../../auth.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
import { ConteoProductoService, ConteoProducto } from '../../services/conteo-producto.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { WsService, ConteoMensaje, ConteoProductoMensaje } from '../../services/webSocket/ws.service';

interface RegistroConteo {
    productoId: number;
    nombre: string;
    cantidadEsperada: number;
    cantidadContada: number | null;
    usuario: string;
    usuarioId: number;
    codigosBarra: string[];
    categoriaId: number;
    categoriaNombre: string;
}

interface CategoryStatus {
    id: number;
    nombre: string;
    totalProducts: number;
    countedProducts: number;
    color: string;
}

@Component({
    selector: 'app-unirse-conteo-categorias',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './unirse-conteo-categorias.component.html',
    styleUrls: ['./unirse-conteo-categorias.component.css']
})
export class UnirseConteoCategoriasComponent implements OnInit, OnDestroy {
    nombreUsuarioLogueado = '';
    usuarioId: number | null = null;
    conteoId: number | null = null;
    conteoActual: Conteo | null = null;
    productosConteo: ConteoProducto[] = [];
    allProductos: Producto[] = [];
    allCategorias: Categoria[] = [];
    registros: RegistroConteo[] = [];
    categories: CategoryStatus[] = [];
    currentView: 'categories' | 'products' = 'categories';
    currentCategoryId: number | null = null;
    currentProductId: number | null = null;
    private countedProducts: Set<number> = new Set();

    private readonly STORAGE_KEY = 'conteoActivoRecibido';
    private readonly REGISTROS_KEY: string;
    private wsSubs: Subscription[] = [];
    private productCache: Map<number, Producto> = new Map();
    private categoryCache: Map<number, Categoria> = new Map();
    private conteoProductosByCategory: Map<number, ConteoProducto[]> = new Map();

    constructor(
        private authService: AuthService,
        private conteoService: ConteoService,
        private conteoProdService: ConteoProductoService,
        private productoService: ProductoService,
        private categoriaService: CategoriaService,
        private usuarioService: UsuarioService,
        private wsService: WsService,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) {
        const id = this.route.snapshot.paramMap.get('id');
        this.conteoId = id ? +id : null;
        this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
        this.REGISTROS_KEY = `unirseConteoCategorias_${this.nombreUsuarioLogueado}`;
    }

    get estadisticas() {
        const totalProductos = this.allProductos.length;
        const contados = this.productosConteo.filter(p => p.cantidadContada != null).length;
        const noContados = totalProductos - contados;
        const porcentajeContados = totalProductos > 0 ? (contados / totalProductos * 100).toFixed(2) : '0.00';
        return {
            totalProductos,
            contados,
            noContados,
            porcentajeContados
        };
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

    get cantidadEsperada(): number {
        const product = this.currentProduct;
        if (!product) return 0;
        const productoConteo = this.productosConteo.find(p => p.productoId === product.id);
        return productoConteo?.cantidadEsperada ?? 0;
    }

    get cantidadContada(): number {
        const product = this.currentProduct;
        if (!product) return 0;
        const productoConteo = this.productosConteo.find(p => p.productoId === product.id);
        return productoConteo?.cantidadContada ?? 0;
    }

    ngOnInit(): void {
        this.wsSubs.push(
            this.wsService.onConteoProductoActualizado().subscribe({
                next: (msg: ConteoProductoMensaje) => {
                    if (msg.conteoId === this.conteoId) {
                        console.log(`WebSocket update for productoId: ${msg.productoId}, cantidadContada: ${msg.cantidadContada}`);
                        const existing = this.productosConteo.find(p => p.productoId === msg.productoId);
                        if (existing) {
                            existing.cantidadContada = msg.cantidadContada;
                            existing.cantidadEsperada = msg.cantidadEsperada;
                            existing.activo = false;
                        } else {
                            this.productosConteo.push({
                                id: msg.id!,
                                conteoId: msg.conteoId,
                                productoId: msg.productoId,
                                cantidadEsperada: msg.cantidadEsperada,
                                cantidadContada: msg.cantidadContada,
                                precioActual: msg.precioActual,
                                activo: false
                            });
                        }
                        if (msg.cantidadContada != null) {
                            this.countedProducts.add(msg.productoId);
                        } else {
                            this.countedProducts.delete(msg.productoId);
                        }
                        this.updateRegistros();
                        this.updateCategories();
                        this.restoreProductPosition();
                        this.saveState();
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => {
                    console.error('WebSocket error:', err);
                }
            })
        );

        this.wsSubs.push(
            this.wsService.onConteoFinalizado().subscribe({
                next: (msg: ConteoMensaje) => {
                    if (msg.id === this.conteoId) {
                        console.log(`Conteo ${msg.id} finalizado`);
                        Swal.fire({
                            icon: 'info',
                            title: 'Conteo Finalizado',
                            text: 'El conteo ha sido finalizado. Serás redirigido al dashboard.',
                            timer: 3000,
                            showConfirmButton: false
                        }).then(() => {
                            localStorage.removeItem(this.STORAGE_KEY);
                            localStorage.removeItem(this.REGISTROS_KEY);
                            this.router.navigate(['/admin/gestionar-conteos']);
                        });
                    }
                },
                error: (err) => {
                    console.error('WebSocket error on conteoFinalizado:', err);
                }
            })
        );

        this.usuarioService.getUsuarios().subscribe({
            next: (usuarios) => {
                const usuario = usuarios.find(u => u.nombreUsuario === this.nombreUsuarioLogueado);
                if (usuario) {
                    this.usuarioId = usuario.id;
                    this.inicializarConteo();
                } else {
                    Swal.fire('Error', 'No se pudo identificar al usuario logueado', 'error');
                    this.router.navigate(['/admin/dashboard']);
                }
            },
            error: () => {
                Swal.fire('Error', 'No se pudo cargar la información del usuario', 'error');
                this.router.navigate(['/admin/dashboard']);
            }
        });

        const saved = localStorage.getItem(this.REGISTROS_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            this.registros = state.registros || [];
            this.currentCategoryId = state.currentCategoryId || null;
            this.currentProductId = state.currentProductId || null;
            this.currentView = state.currentView || 'categories';
            this.countedProducts = new Set(state.countedProducts || []);
            this.cdr.detectChanges();
        }
    }

    ngOnDestroy(): void {
        this.wsSubs.forEach(sub => sub.unsubscribe());
    }

    private inicializarConteo(): void {
        const yaRecibido = localStorage.getItem(this.STORAGE_KEY);
        if (this.conteoId) {
            this.cargarConteo(this.conteoId);
        } else if (yaRecibido) {
            const msg = JSON.parse(yaRecibido) as { id: number; fechaHora: string };
            this.cargarConteo(msg.id);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'No hay conteo activo',
                text: 'No se encontró un conteo activo para unirse.',
            }).then(() => {
                this.router.navigate(['/admin/dashboard']);
            });
        }
    }

    private cargarConteo(id: number): void {
        this.conteoService.getById(id).subscribe({
            next: (conteo) => {
                if (conteo.tipoConteo !== 'CATEGORIAS') {
                    Swal.fire('Error', 'Este conteo no es de tipo Categorías', 'error');
                    this.router.navigate(['/admin/dashboard']);
                    return;
                }
                this.conteoActual = conteo;
                this.conteoId = id;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                    id: conteo.id,
                    fechaHora: conteo.fechaHora.toString()
                }));
                this.registrarParticipante();
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error loading conteo:', err);
                Swal.fire('Error', 'No se pudo cargar el conteo', 'error');
                this.router.navigate(['/admin/dashboard']);
            }
        });
    }

    private registrarParticipante(): void {
        if (!this.conteoId || !this.usuarioId) {
            console.error('Cannot register participant: conteoId or usuarioId is null');
            return;
        }
        this.conteoService.registrarParticipante(this.conteoId, this.usuarioId).subscribe({
            next: (usuario) => {
                console.log(`Usuario ${usuario.nombreUsuario} registrado en conteo ${this.conteoId}`);
            },
            error: (err) => {
                console.error('Error registering participant:', err);
            }
        });
    }

    private cargarDatos(): void {
        const sucursalId = this.authService.getSucursalId();
        if (sucursalId == null) {
            Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
            this.router.navigate(['/admin/dashboard']);
            return;
        }

        this.categoriaService.obtenerCategoriasPorSucursal(sucursalId).subscribe({
            next: (categorias) => {
                this.allCategorias = categorias;
                categorias.forEach(cat => this.categoryCache.set(cat.id, cat));
                this.loadConteoProductos();
            },
            error: (err) => {
                console.error('Error loading categorias:', err);
                Swal.fire('Error', 'No se pudo cargar las categorías', 'error');
                this.router.navigate(['/admin/dashboard']);
            }
        });
    }

    private async loadConteoProductos(): Promise<void> {
        if (!this.conteoId) return;

        this.conteoProdService.getConteoProductosByConteoId1(this.conteoId).subscribe({
            next: async (productos) => {
                console.log(`Loaded ${productos.length} conteo_productos for conteoId: ${this.conteoId}`, productos.map(p => ({
                    productoId: p.productoId,
                    cantidadContada: p.cantidadContada
                })));
                this.productosConteo = productos;
                this.conteoProductosByCategory.clear();

                this.countedProducts.clear();
                for (const cp of productos) {
                    if (cp.cantidadContada != null) {
                        this.countedProducts.add(cp.productoId);
                    }

                    let producto: Producto;
                    const cached = this.productCache.get(cp.productoId);
                    if (cached) {
                        producto = cached;
                    } else {
                        try {
                            const fetched = await lastValueFrom(this.productoService.obtenerProductoPorId(cp.productoId));
                            if (!fetched) {
                                console.warn(`Producto ${cp.productoId} no encontrado tras fetch`);
                                continue;
                            }
                            producto = fetched;
                            this.productCache.set(cp.productoId, producto);
                            if (!this.allProductos.some(p => p.id === producto.id)) {
                                this.allProductos.push(producto);
                            }
                        } catch (err) {
                            console.warn(`Failed to load product ${cp.productoId}:`, err);
                            continue;
                        }
                    }

                    const categoriaId = producto.categoriaId;
                    if (!this.conteoProductosByCategory.has(categoriaId)) {
                        this.conteoProductosByCategory.set(categoriaId, []);
                    }
                    this.conteoProductosByCategory.get(categoriaId)!.push(cp);

                    if (!this.categoryCache.has(categoriaId)) {
                        try {
                            const categoria = await lastValueFrom(this.productoService.obtenerCategoriaPorId(categoriaId));
                            if (!categoria) {
                                console.warn(`Categoría ${categoriaId} no encontrada tras fetch`);
                                continue;
                            }
                            this.categoryCache.set(categoriaId, categoria);
                            if (!this.allCategorias.some(c => c.id === categoria.id)) {
                                this.allCategorias.push(categoria);
                            }
                        } catch (err) {
                            console.warn(`Failed to load category ${categoriaId}:`, err);
                        }
                    }
                }

                this.allProductos.sort((a, b) => a.id - b.id);
                this.updateRegistros();
                this.updateCategories();
                this.restoreProductPosition();
                this.saveState();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading conteoProductos:', err);
                Swal.fire('Error', 'No se pudieron cargar los productos del conteo', 'error');
                this.router.navigate(['/admin/dashboard']);
            }
        });
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
                categoriaId: prod.categoriaId,
                categoriaNombre: cat?.nombre || 'Sin Categoría'
            };
            this.registros.push(reg);
        }
        this.saveState();
    }

    private updateCategories(): void {
        this.categories = this.allCategorias
            .map(cat => {
                const conteoProductos = this.conteoProductosByCategory.get(cat.id) || [];
                const counted = conteoProductos.filter(cp => this.countedProducts.has(cp.productoId)).length;
                console.log(`Category ${cat.nombre}: ${counted}/${conteoProductos.length} products counted`);
                return {
                    id: cat.id,
                    nombre: cat.nombre,
                    totalProducts: conteoProductos.length,
                    countedProducts: counted,
                    color: counted === 0 ? '#ffcccb' : counted === conteoProductos.length ? '#ccffcc' : '#ffff99'
                };
            })
            .filter(cat => cat.totalProducts > 0);
    }

    private restoreProductPosition(): void {
        if (this.currentCategoryId && this.currentProductId) {
            const conteoProductos = this.conteoProductosByCategory.get(this.currentCategoryId) || [];
            if (conteoProductos.some(cp => cp.productoId === this.currentProductId)) {
                this.currentView = 'products';
            } else {
                this.currentProductId = this.getNextUncountedProductId(this.currentCategoryId);
                this.currentView = this.currentProductId ? 'products' : 'categories';
                this.saveState();
            }
        }
    }

    selectCategory(categoryId: number): void {
        const category = this.categories.find(c => c.id === categoryId);
        if (category && category.countedProducts === category.totalProducts) {
            this.showFullyCountedCategoryModal(categoryId);
        } else {
            this.currentCategoryId = categoryId;
            const conteoProductos = this.conteoProductosByCategory.get(categoryId) || [];
            const lastProductId = this.currentProductId && conteoProductos.some(cp => cp.productoId === this.currentProductId)
                ? this.currentProductId
                : this.getNextUncountedProductId(categoryId);
            this.currentProductId = lastProductId;
            this.currentView = lastProductId ? 'products' : 'categories';
            this.saveState();
            this.cdr.detectChanges();
        }
    }

    private showFullyCountedCategoryModal(categoryId: number): void {
        const categoryRegistros = this.registros.filter(r => r.categoriaId === categoryId);
        const category = this.categoryCache.get(categoryId);
        Swal.fire({
            title: `Categoría Completada: ${category?.nombre || 'Sin Categoría'}`,
            html: `
            <style>
                .table-container {
                    max-height: 400px;
                    max-width: 100%;
                    overflow-y: auto;
                    overflow-x: auto;
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
                th:nth-child(2), td:nth-child(2) { width: 50%; min-width: 200px; }
                th:nth-child(3), td:nth-child(3) { width: 15%; }
                th:nth-child(4), td:nth-child(4) { width: 15%; }
                input.form-control-sm {
                    width: 100%;
                    box-sizing: border-box;
                }
                thead th {
                    position: sticky;
                    top: 0;
                    background-color: #343a40;
                    color: white;
                    z-index: 2;
                }
            </style>
            <p>Esta categoría ya ha sido completamente contada. Puedes revisar y editar las cantidades contadas:</p>
            <div class="table-container">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Esperada</th>
                            <th>Contada</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryRegistros.map(r => `
                            <tr>
                                <td>${r.productoId}</td>
                                <td>${r.nombre}</td>
                                <td>${r.cantidadEsperada}</td>
                                <td><input type="number" id="contada-${r.productoId}" value="${r.cantidadContada != null ? r.cantidadContada : ''}" min="0" class="form-control form-control-sm"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6',
            width: '80%'
        }).then(result => {
            if (result.isConfirmed) {
                let updatesCount = 0;
                categoryRegistros.forEach(r => {
                    const input = document.getElementById(`contada-${r.productoId}`) as HTMLInputElement;
                    const cantidad = Number(input.value);
                    if (cantidad !== r.cantidadContada && cantidad >= 0) {
                        this.handleEditCount(r.productoId, cantidad, true);
                        updatesCount++;
                    }
                });
                if (updatesCount > 0) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cantidades Actualizadas',
                        text: `${updatesCount} producto(s) han sido actualizados correctamente.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
                this.cdr.detectChanges();
            }
        });
    }

    private getNextUncountedProductId(categoryId: number): number | null {
        const conteoProductos = this.conteoProductosByCategory.get(categoryId) || [];
        const uncounted = conteoProductos.find(cp => !this.countedProducts.has(cp.productoId));
        return uncounted ? uncounted.productoId : null;
    }

    async countProduct(prod: Producto): Promise<void> {
        const item = this.productosConteo.find(p => p.productoId === prod.id);
        if (!item) {
            Swal.fire('Error', 'Producto no registrado en este conteo', 'error');
            return;
        }
        const { value, isConfirmed } = await Swal.fire<number>({
            title: `Ingresar cantidad (esperada: ${item.cantidadEsperada})`,
            input: 'number',
            inputLabel: prod.nombre,
            inputValue: item.cantidadContada != null ? item.cantidadContada : '',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || Number(value) < 0) {
                    return 'Por favor, ingrese una cantidad válida (0 o mayor)';
                }
                return null;
            }
        });
        if (!isConfirmed || value == null) {
            return;
        }
        const nuevaCant = Number(value);
        this.conteoProdService.update(item.id, { cantidadContada: nuevaCant }).pipe(retry(2), delay(500)).subscribe({
            next: (updated) => {
                console.log(`Updated productoId: ${item.productoId}, cantidadContada: ${updated.cantidadContada}`);
                item.cantidadContada = updated.cantidadContada;
                this.countedProducts.add(item.productoId);
                const existente = this.registros.find(r => r.productoId === item.productoId);
                const cat = this.categoryCache.get(prod.categoriaId);
                const reg: RegistroConteo = {
                    productoId: item.productoId,
                    nombre: prod.nombre,
                    cantidadEsperada: item.cantidadEsperada,
                    cantidadContada: updated.cantidadContada,
                    usuario: this.nombreUsuarioLogueado,
                    usuarioId: this.usuarioId!,
                    codigosBarra: prod.codigosBarra,
                    categoriaId: prod.categoriaId,
                    categoriaNombre: cat?.nombre || 'Sin Categoría'
                };
                if (existente) {
                    Object.assign(existente, reg);
                } else {
                    this.registros.push(reg);
                }
                this.updateRegistros();
                this.updateCategories();
                this.saveState();
                Swal.fire('Éxito', `Cantidad actualizada para ${prod.nombre}`, 'success');
                const nextProductId = this.getNextUncountedProductId(this.currentCategoryId!);
                if (nextProductId === null) {
                    this.showCategoryCompletedModal();
                } else {
                    this.currentProductId = nextProductId;
                    this.saveState();
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Error updating conteo:', err);
                Swal.fire('Error', 'No se pudo actualizar la cantidad en la base de datos', 'error');
            }
        });
    }

    private showCategoryCompletedModal(): void {
        const categoryRegistros = this.registros.filter(r => r.categoriaId === this.currentCategoryId);
        const category = this.categoryCache.get(this.currentCategoryId!);
        Swal.fire({
            title: `Categoría Completada: ${category?.nombre || 'Sin Categoría'}`,
            html: `
            <style>
                .table-container {
                    max-height: 400px;
                    max-width: 100%;
                    overflow-y: auto;
                    overflow-x: auto;
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
                th:nth-child(2), td:nth-child(2) { width: 50%; min-width: 200px; }
                th:nth-child(3), td:nth-child(3) { width: 15%; }
                th:nth-child(4), td:nth-child(4) { width: 15%; }
                input.form-control-sm {
                    width: 100%;
                    box-sizing: border-box;
                }
                thead th {
                    position: sticky;
                    top: 0;
                    background-color: #343a40;
                    color: white;
                    z-index: 2;
                }
            </style>
            <div class="table-container">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Esperada</th>
                            <th>Contada</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryRegistros.map(r => `
                            <tr>
                                <td>${r.productoId}</td>
                                <td>${r.nombre}</td>
                                <td>${r.cantidadEsperada}</td>
                                <td><input type="number" id="contada-${r.productoId}" value="${r.cantidadContada != null ? r.cantidadContada : ''}" min="0" class="form-control form-control-sm"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6',
            width: '80%'
        }).then(result => {
            if (result.isConfirmed) {
                let updatesCount = 0;
                categoryRegistros.forEach(r => {
                    const input = document.getElementById(`contada-${r.productoId}`) as HTMLInputElement;
                    const cantidad = Number(input.value);
                    if (cantidad !== r.cantidadContada && cantidad >= 0) {
                        this.handleEditCount(r.productoId, cantidad, true);
                        updatesCount++;
                    }
                });
                if (updatesCount > 0) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cantidades Actualizadas',
                        text: `${updatesCount} producto(s) han sido actualizados correctamente.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
                this.currentView = 'categories';
                this.currentCategoryId = null;
                this.currentProductId = null;
                this.saveState();
                this.cdr.detectChanges();
            }
        });
    }

    private handleEditCount(productoId: number, cantidad: number, silent: boolean = false): void {
        if (cantidad < 0) {
            if (!silent) {
                Swal.fire('Error', 'La cantidad no puede ser negativa', 'error');
            }
            return;
        }
        const item = this.productosConteo.find(p => p.productoId === productoId);
        if (item) {
            this.conteoProdService.update(item.id, { cantidadContada: cantidad }).pipe(retry(2), delay(500)).subscribe({
                next: (updated) => {
                    console.log(`Edited productoId: ${productoId}, cantidadContada: ${updated.cantidadContada}`);
                    item.cantidadContada = updated.cantidadContada;
                    if (updated.cantidadContada != null) {
                        this.countedProducts.add(productoId);
                    } else {
                        this.countedProducts.delete(productoId);
                    }
                    const reg = this.registros.find(r => r.productoId === productoId);
                    if (reg) {
                        reg.cantidadContada = updated.cantidadContada;
                        this.updateRegistros();
                        this.updateCategories();
                        this.saveState();
                        if (!silent) {
                            Swal.fire('Éxito', 'Cantidad actualizada correctamente', 'success');
                        }
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => {
                    console.error('Error updating conteo:', err);
                    if (!silent) {
                        Swal.fire('Error', 'No se pudo actualizar la cantidad en la base de datos', 'error');
                    }
                }
            });
        }
    }

    private async updateUncountedProductsToZero(): Promise<void> {
        const uncounted = this.productosConteo.filter(p => p.cantidadContada === null);
        for (const item of uncounted) {
            try {
                const updated = await lastValueFrom(
                    this.conteoProdService.update(item.id, { cantidadContada: 0 }).pipe(retry(2), delay(500))
                );
                console.log(`Updated uncounted productoId: ${item.productoId} to cantidadContada: 0`);
                item.cantidadContada = 0;
                this.countedProducts.add(item.productoId);
                const reg = this.registros.find(r => r.productoId === item.productoId);
                if (reg) {
                    reg.cantidadContada = 0;
                }
            } catch (err) {
                console.error(`Error updating productoId: ${item.productoId} to 0`, err);
                throw err;
            }
        }
        this.updateRegistros();
        this.updateCategories();
        this.saveState();
        this.cdr.detectChanges();
    }

    finalizarConteo(): void {
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
                            localStorage.removeItem(this.STORAGE_KEY);
                            localStorage.removeItem(this.REGISTROS_KEY);
                            this.router.navigate(['/admin/gestionar-conteos']);
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
                                localStorage.removeItem(this.STORAGE_KEY);
                                localStorage.removeItem(this.REGISTROS_KEY);
                                this.router.navigate(['/admin/gestionar-conteos']);
                            },
                            error: (err) => {
                                Swal.close(); // Cerrar el modal de carga en caso de error
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
                    } catch (err) {
                        Swal.close(); // Cerrar el modal de carga en caso de error
                        Swal.fire('Error', 'No se pudo actualizar los productos no contados', 'error');
                    }
                }
            });
        }
    }

    public saveState(): void {
        localStorage.setItem(this.REGISTROS_KEY, JSON.stringify({
            registros: this.registros,
            currentCategoryId: this.currentCategoryId,
            currentProductId: this.currentProductId,
            currentView: this.currentView,
            countedProducts: Array.from(this.countedProducts)
        }));
    }

    logout(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.REGISTROS_KEY);
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    get currentProduct(): Producto | null {
        if (!this.currentProductId) return null;
        return this.productCache.get(this.currentProductId) || null;
    }

    get currentCategory(): Categoria | null {
        if (!this.currentCategoryId) return null;
        return this.categoryCache.get(this.currentCategoryId) || null;
    }

    get currentProductIndex(): number {
        if (!this.currentCategoryId || !this.currentProductId) return 0;
        const conteoProductos = this.conteoProductosByCategory.get(this.currentCategoryId) || [];
        const index = conteoProductos.findIndex(cp => cp.productoId === this.currentProductId);
        return index >= 0 ? index + 1 : 0;
    }

    get totalProductsInCategory(): number {
        if (!this.currentCategoryId) return 0;
        return (this.conteoProductosByCategory.get(this.currentCategoryId) || []).length;
    }
}