import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { SucursalService, Sucursal } from '../../services/sucursal.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';


@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css']
})
export class CrearUsuarioComponent implements OnInit {

  usuario: Partial<Usuario> = {
    nombre: '',
    apellido: '',
    nombreUsuario: '',
    contrasenia: '',
    rol: '',
    sucursalId: 0
  };

  sucursales: Sucursal[] = [];
  roles: string[] = ['SUPERADMINISTRADOR', 'ADMINISTRADOR', 'EMPLEADO'];
  filtroSucursal: string = '';
  nombreSucursalSeleccionada: string = '';

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.sucursalService.getAllSucursales().subscribe({
      next: (data) => {
        this.sucursales = data.filter(s => s.activo);
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error')
    });
  }

  crearUsuario(): void {
    const esSuperadmin = this.usuario.rol === 'SUPERADMINISTRADOR';

    if (
      !this.usuario.nombre || !this.usuario.apellido || !this.usuario.nombreUsuario ||
      !this.usuario.contrasenia || !this.usuario.rol ||
      (!esSuperadmin && !this.usuario.sucursalId)
    ) {
      Swal.fire('Campos incompletos', 'Completá todos los campos requeridos. La sucursal es obligatoria salvo para el rol SUPERADMINISTRADOR.', 'warning');
      return;
    }

    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        const yaExiste = usuarios.some(u =>
          u.nombreUsuario.toLowerCase() === this.usuario.nombreUsuario!.toLowerCase()
        );

        if (yaExiste) {
          Swal.fire('Error', 'Ya existe un usuario con ese nombre de usuario', 'error');
          return;
        }

        this.continuarCreacion();
      },
      error: () => Swal.fire('Error', 'No se pudo verificar el nombre de usuario', 'error')
    });
  }

  continuarCreacion(): void {
    const usuarioParaCrear: Usuario = {
      ...(this.usuario as Usuario),
    };

    // Si es superadmin, aseguramos que sucursalId sea undefined (no 0)
    if (usuarioParaCrear.rol === 'SUPERADMINISTRADOR') {
      usuarioParaCrear.sucursalId = undefined;
    }

    this.usuarioService.crearUsuario(usuarioParaCrear).subscribe({
      next: (nuevo) => {
        Swal.fire({
          title: 'Usuario creado',
          html: `
            <p><strong>Nombre:</strong> ${nuevo.nombre} ${nuevo.apellido}</p>
            <p><strong>Usuario:</strong> ${nuevo.nombreUsuario}</p>
            <p><strong>Rol:</strong> ${nuevo.rol}</p>
          `,
          icon: 'success',
          confirmButtonText: 'Volver'
        }).then(() => this.router.navigate(['/superadmin/dashboard']));
      },
      error: () => Swal.fire('Error', 'No se pudo crear el usuario', 'error')
    });
  }

  sucursalesFiltradas(): Sucursal[] {
    const filtro = this.filtroSucursal.toLowerCase();
    return this.sucursales.filter(s =>
      s.nombre.toLowerCase().includes(filtro) || s.direccion.toLowerCase().includes(filtro)
    );
  }

  seleccionarSucursalDesdeModal(sucursal: Sucursal): void {
    this.usuario.sucursalId = sucursal.id;
    this.nombreSucursalSeleccionada = sucursal.nombre;
  }

  
  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
