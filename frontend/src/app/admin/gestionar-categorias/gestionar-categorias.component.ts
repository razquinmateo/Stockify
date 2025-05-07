import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../auth.service';
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
  categoriaSeleccionada: Categoria = this.resetCategoria();
  esEditar: boolean = false;

  // Filtros y paginación
  filtro: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 5;

  constructor(private categoriaService: CategoriaService, private authService: AuthService) {}

  ngOnInit(): void {
    this.obtenerCategorias();
  }

//   obtenerCategorias(): void {
//     this.categoriaService.obtenerTodasLasCategorias().subscribe(data => this.categorias = data);
//   }

  obtenerCategorias(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      this.categoriaService.obtenerTodasLasCategorias().subscribe(data => {
        // Filtra las categorías por sucursal
        this.categorias = data.filter(cat => cat.sucursalId === sucursalId);
      });
    } else {
      // Si no hay sucursal, puedes mostrar vacío o un error
      this.categorias = [];
      console.error('No se pudo obtener el ID de la sucursal');
    }
  }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.categoriaSeleccionada = this.resetCategoria();
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
          next: () => {
            Swal.fire('Éxito', `Categoría ${accion}a correctamente`, 'success');
            this.obtenerCategorias();
          },
          error: () => {
            Swal.fire('Error', `No se pudo ${accion} la categoría`, 'error');
          }
        });
      }
    });
  }

  guardarCategoria(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoriaModal'));

    if (this.esEditar) {
      this.categoriaService.actualizarCategoria(this.categoriaSeleccionada).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Actualizada', 'La categoría ha sido actualizada', 'success');
          this.obtenerCategorias();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar la categoría', 'error');
        }
      });
    } else {
      this.categoriaService.agregarCategoria(this.categoriaSeleccionada).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Agregada', 'La categoría ha sido agregada', 'success');
          this.obtenerCategorias();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo agregar la categoría', 'error');
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
      sucursalId: 0,
      activo: true
    };
  }

  // ✅ Filtrado de categorías
  filtrarCategorias(): Categoria[] {
    return this.categorias.filter(cat =>
      cat.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      cat.descripcion.toLowerCase().includes(this.filtro.toLowerCase())
    )
    .sort((a, b) => a.id - b.id); // Orden ascendente por ID
  }

  // ✅ Paginación de categorías
  obtenerCategoriasPaginadas(): Categoria[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.filtrarCategorias().slice(inicio, inicio + this.elementosPorPagina);
  }

  // ✅ Total de páginas
  totalPaginas(): number {
    return Math.ceil(this.filtrarCategorias().length / this.elementosPorPagina);
  }

}
