import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestionar-categorias.component.html',
  styleUrls: ['./gestionar-categorias.component.css']
})
export class GestionarCategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  categoriaSeleccionada!: Categoria;
  esEditar: boolean = false;

  filtro: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 10;
  maxPaginasMostradas: number = 5;
  nombreUsuarioLogueado: string = '';

  constructor(private categoriaService: CategoriaService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.categoriaSeleccionada = this.resetCategoria();
    this.obtenerCategorias();
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }

  obtenerCategorias(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      this.categoriaService.obtenerCategoriasPorSucursal(sucursalId).subscribe({
        next: (data) => {
          this.categorias = data;
        },
        error: (err) => {
          console.error('Error al obtener categorías:', err);
          Swal.fire('Error', 'No se pudieron cargar las categorías.', 'error');
        }
      });
    } else {
      this.categorias = [];
      Swal.fire('Error', 'No se pudo determinar la sucursal.', 'error');
    }
  }

  buscarPorCodigoCategoria(codigoCategoria: string): void {
    const sucursalId = this.authService.getSucursalId();
    if (!codigoCategoria || sucursalId === null) {
      this.obtenerCategorias();
      return;
    }
    this.categoriaService.obtenerCategoriaPorCodigoYSucursal(codigoCategoria, sucursalId).subscribe({
      next: (categoria) => {
        this.categorias = categoria ? [categoria] : [];
      },
      error: (err) => {
        console.error('Error al buscar por código:', err);
        this.categorias = [];
        Swal.fire('Error', 'No se encontró ninguna categoría con ese código.', 'error');
      }
    });
  }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.categoriaSeleccionada = this.resetCategoria();
    if (!this.categoriaSeleccionada.sucursalId) {
      Swal.fire('Error', 'No se pudo determinar la sucursal.', 'error');
      return;
    }
    this.mostrarModal();
  }

  editarCategoria(cat: Categoria): void {
    this.esEditar = true;
    this.categoriaSeleccionada = { ...cat };
    this.mostrarModal();
  }

  toggleEstadoCategoria(cat: Categoria): void {
    const accion = cat.activo ? 'deshabilitar' : 'activar';
    const nuevoEstado = !cat.activo;

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `La categoría será ${accion}a`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const categoriaActualizada = { ...cat, activo: nuevoEstado };
        this.categoriaService.actualizarCategoria(categoriaActualizada).subscribe({
          next: (categoria: Categoria) => {
            const index = this.categorias.findIndex(c => c.id === categoria.id);
            if (index !== -1) {
              this.categorias[index] = categoria;
            }
            Swal.fire('Éxito', `Categoría ${accion}a correctamente`, 'success');
          },
          error: (err: any) => {
            console.error('Error al cambiar estado:', err);
            Swal.fire('Error', `No se pudo ${accion} la categoría: ${err.message || 'Error desconocido'}`, 'error');
          }
        });
      }
    });
  }

  guardarCategoria(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoriaModal'));

    if (!this.categoriaSeleccionada.nombre || !this.categoriaSeleccionada.sucursalId) {
      Swal.fire('Error', 'El nombre y la sucursal son obligatorios.', 'error');
      return;
    }

    if (this.esEditar) {
      this.categoriaService.actualizarCategoria(this.categoriaSeleccionada).subscribe({
        next: (categoriaActualizada: Categoria) => {
          const index = this.categorias.findIndex(c => c.id === categoriaActualizada.id);
          if (index !== -1) {
            this.categorias[index] = categoriaActualizada;
          }
          modal.hide();
          Swal.fire('Actualizada', 'La categoría ha sido actualizada', 'success');
        },
        error: (err: any) => {
          console.error('Error al actualizar:', err);
          Swal.fire('Error', `No se pudo actualizar la categoría: ${err.message || 'Error desconocido'}`, 'error');
        }
      });
    } else {
      this.categoriaService.agregarCategoria(this.categoriaSeleccionada).subscribe({
        next: (nuevaCategoria: Categoria) => {
          this.categorias.push(nuevaCategoria);
          modal.hide();
          Swal.fire('Agregada', 'La categoría ha sido agregada', 'success');
        },
        error: (err: any) => {
          console.error('Error al agregar:', err);
          Swal.fire('Error', `No se pudo agregar la categoría: ${err.message || 'Error desconocido'}`, 'error');
        }
      });
    }
  }

  mostrarModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
  }

  resetCategoria(): Categoria {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      codigoCategoria: '',
      sucursalId: this.authService.getSucursalId() || 0,
      activo: true
    };
  }

  filtrarCategorias(): Categoria[] {
    return this.categorias.filter(cat =>
      cat.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      cat.descripcion.toLowerCase().includes(this.filtro.toLowerCase()) ||
      cat.codigoCategoria.toLowerCase().includes(this.filtro.toLowerCase())
    ).sort((a, b) => a.id - b.id);
  }

  obtenerCategoriasPaginadas(): Categoria[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.filtrarCategorias().slice(inicio, inicio + this.elementosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.filtrarCategorias().length / this.elementosPorPagina);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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