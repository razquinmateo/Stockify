import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { SucursalService, Sucursal } from '../../services/sucursal.service';
import { EmpresaService, Empresa } from '../../services/empresa.service';
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
  nombreUsuarioLogueado: string = '';


  roles: string[] = ['SUPERADMINISTRADOR', 'ADMINISTRADOR', 'EMPLEADO'];

  // Empresa
  empresas: Empresa[] = [];
  filtroEmpresa: string = '';
  nombreEmpresaSeleccionada: string = '';
  empresaIdSeleccionada: number = 0;

  // Sucursales
  todasLasSucursales: Sucursal[] = [];
  sucursalesFiltradasList: Sucursal[] = [];
  filtroSucursal: string = '';
  nombreSucursalSeleccionada: string = '';

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private empresaService: EmpresaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data) => {
        this.empresas = data.filter(e => e.activo);
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error')
    });

    this.sucursalService.getAllSucursales().subscribe({
      next: (data) => {
        this.todasLasSucursales = data;
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error')
    });

    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }

  crearUsuario(): void {
    const esSuperadmin = this.usuario.rol === 'SUPERADMINISTRADOR';

    if (
      !this.usuario.nombre || !this.usuario.apellido || !this.usuario.nombreUsuario ||
      !this.usuario.contrasenia || !this.usuario.rol ||
      (!esSuperadmin && (!this.empresaIdSeleccionada || !this.usuario.sucursalId))
    ) {
      Swal.fire('Campos incompletos', 'Completá todos los campos requeridos. Empresa y sucursal no son necesarias solo si el rol es SUPERADMINISTRADOR.', 'warning');
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
      ...(this.usuario as Usuario)
    };

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

  filtrarEmpresas(): Empresa[] {
    const filtro = this.filtroEmpresa.toLowerCase();
    return this.empresas.filter(e =>
      e.nombre.toLowerCase().includes(filtro) || e.direccion.toLowerCase().includes(filtro)
    );
  }

  seleccionarEmpresaDesdeModal(empresa: Empresa): void {
    this.empresaIdSeleccionada = empresa.id;
    this.nombreEmpresaSeleccionada = empresa.nombre;

    this.usuario.sucursalId = 0;
    this.nombreSucursalSeleccionada = '';

    // Filtrar sucursales de la empresa seleccionada
    this.sucursalesFiltradasList = this.todasLasSucursales.filter(s =>
      s.empresaId === empresa.id && s.activo
    );

    // Mostrar alerta si no hay sucursales disponibles
    if (this.sucursalesFiltradasList.length === 0) {
      Swal.fire({
        title: 'Sin sucursales',
        text: 'Esta empresa no tiene sucursales activas. Por favor, contactá con el administrador.',
        icon: 'info'
      });
    }
  }


  sucursalesFiltradas(): Sucursal[] {
    const filtro = this.filtroSucursal.toLowerCase();
    return this.sucursalesFiltradasList.filter(s =>
      s.nombre.toLowerCase().includes(filtro) || s.direccion.toLowerCase().includes(filtro)
    );
  }

  seleccionarSucursalDesdeModal(sucursal: Sucursal): void {
    this.usuario.sucursalId = sucursal.id;
    this.nombreSucursalSeleccionada = sucursal.nombre;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}