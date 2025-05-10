import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs';

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
  productoSeleccionado!: Producto;
  esEditar: boolean = false;

  filtro: string = '';
  paginaActual: number = 1;
  elementosPorPagina: number = 5;
  nombreUsuarioLogueado: string = '';

  constructor(
    private productoService: ProductoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productoSeleccionado = this.resetProducto();
    this.obtenerProductosConCategorias();
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }

  obtenerProductos(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      this.productoService.obtenerTodosLosProductos().subscribe(data => {
        this.productos = data.filter(prod => prod.sucursalId === sucursalId);
      });
    } else {
      this.productos = [];
      console.error('No se pudo obtener el ID de la sucursal');
    }
  }

  obtenerProductosConCategorias(): void {
      const sucursalId = this.authService.getSucursalId();
      if (sucursalId !== null) {
        this.productoService.obtenerTodosLosProductos().subscribe(data => {
          // Aquí hacemos una llamada adicional para obtener los nombres de las categorías
          const categoriaRequests: Observable<any>[] = data.map(prod =>
            this.productoService.obtenerCategoriaPorId(prod.categoriaId)
          );

          forkJoin(categoriaRequests).subscribe(categorias => {
            data.forEach((prod, index) => {
              prod.categoriaNombre = categorias[index].nombre; // Asignamos el nombre de la categoría
            });
            this.productos = data.filter(prod => prod.sucursalId === sucursalId);
          });
        });
      } else {
        this.productos = [];
        console.error('No se pudo obtener el ID de la sucursal');
      }
    }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.productoSeleccionado = this.resetProducto();
    this.mostrarModal();
  }

  editarProducto(prod: Producto): void {
    this.esEditar = true;
    this.productoSeleccionado = { ...prod };
    this.mostrarModal();
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
            this.obtenerProductos();
          },
          error: () => {
            Swal.fire('Error', `No se pudo ${accion} el producto`, 'error');
          }
        });
      }
    });
  }

  guardarProducto(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));

    if (this.esEditar) {
      this.productoService.actualizarProducto(this.productoSeleccionado).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Actualizado', 'El producto ha sido actualizado', 'success');
          this.obtenerProductos();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
        }
      });
    } else {
      this.productoService.agregarProducto(this.productoSeleccionado).subscribe({
        next: () => {
          modal.hide();
          Swal.fire('Agregado', 'El producto ha sido agregado', 'success');
          this.obtenerProductos();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo agregar el producto', 'error');
        }
      });
    }
  }

  mostrarModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('productoModal'));
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

  filtrarProductos(): Producto[] {
    return this.productos.filter(prod =>
      prod.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      prod.detalle.toLowerCase().includes(this.filtro.toLowerCase()) ||
      prod.codigoBarra.includes(this.filtro) ||
      prod.id.toString().includes(this.filtro)
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
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
