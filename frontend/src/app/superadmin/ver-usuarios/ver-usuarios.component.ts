import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { SucursalService, Sucursal } from '../../services/sucursal.service';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ver-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ver-usuarios.component.html',
  styleUrls: ['./ver-usuarios.component.css']
})
export class VerUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  sucursales: Sucursal[] = [];
  empresas: Empresa[] = [];

  filtro: string = '';
  currentPage = 1;
  itemsPerPage = 10;
  nombreUsuario: string = '';
  rolUsuario: string = '';
  nombreUsuarioLogueado: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private empresaService: EmpresaService,
    private authService: AuthService,
    private router: Router
  ) { }

  get totalPages(): number {
    return Math.ceil(this.filtrarUsuariosSinPaginar().length / this.itemsPerPage);
  }

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargarSucursales();
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error')
    });
  }

  cargarSucursales(): void {
    this.sucursalService.getAllSucursales().subscribe({
      next: (sucs) => {
        this.sucursales = sucs;
        this.cargarEmpresas();
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error')
    });
  }

  cargarEmpresas(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (emps) => this.empresas = emps,
      error: () => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error')
    });
  }

  obtenerNombreSucursal(id: number): string {
    return this.sucursales.find(s => s.id === id)?.nombre || '-';
  }

  obtenerNombreEmpresaDeSucursal(sucursalId: number): string {
    const sucursal = this.sucursales.find(s => s.id === sucursalId);
    if (!sucursal) return '-';
    const empresa = this.empresas.find(e => e.id === sucursal.empresaId);
    return empresa?.nombre || '-';
  }

  editarUsuario(id: number): void {
    this.router.navigate(['/superadmin/editar-usuario', id]);
  }

  deshabilitarUsuario(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El usuario será deshabilitado',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, deshabilitar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.usuarioService.deshabilitarUsuario(id).subscribe({
          next: () => {
            Swal.fire('Deshabilitado', 'El usuario ha sido deshabilitado', 'success');
            this.cargarDatos();
          },
          error: () => Swal.fire('Error', 'No se pudo deshabilitar el usuario', 'error')
        });
      }
    });
  }

  activarUsuario(id: number): void {
    Swal.fire({
      title: '¿Volver a activar este usuario?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.usuarioService.actualizarUsuario(id, { activo: true }).subscribe({
          next: () => {
            Swal.fire('Activado', 'El usuario ha sido reactivado', 'success');
            this.cargarDatos();
          },
          error: () => Swal.fire('Error', 'No se pudo activar el usuario', 'error')
        });
      }
    });
  }

  filtrarUsuariosSinPaginar(): Usuario[] {
    const f = this.filtro.toLowerCase();
    return this.usuarios
      .filter(u =>
        u.nombre.toLowerCase().includes(f) ||
        u.apellido.toLowerCase().includes(f) ||
        u.nombreUsuario.toLowerCase().includes(f) ||
        u.rol.toLowerCase().includes(f) ||
        (u.activo ? 'activa' : 'inactiva').includes(f)
      )
      .sort((a, b) => Number(b.activo) - Number(a.activo));
  }

  filtrarUsuarios(): Usuario[] {
    const inicio = (this.currentPage - 1) * this.itemsPerPage;
    const fin = inicio + this.itemsPerPage;
    return this.filtrarUsuariosSinPaginar().slice(inicio, fin);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
