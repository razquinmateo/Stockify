import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { SucursalService, Sucursal } from '../../services/sucursal.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.css']
})
export class EditarUsuarioComponent implements OnInit {
  usuarioId!: number;
  usuario: Partial<Usuario> = {};
  sucursales: Sucursal[] = [];
  filtroSucursal: string = '';
  nombreSucursalSeleccionada: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    this.usuarioId = Number(this.route.snapshot.paramMap.get('id'));

    this.usuarioService.getUsuarioPorId(this.usuarioId).subscribe({
      next: (data) => {
        this.usuario = data;
        this.nombreSucursalSeleccionada = `ID ${data.sucursalId}`;
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el usuario', 'error')
    });

    this.sucursalService.getAllSucursales().subscribe({
      next: (data) => {
        this.sucursales = data.filter(s => s.activo);
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error')
    });
  }

  guardarCambios(): void {
    if (
      !this.usuario.nombre || !this.usuario.apellido || !this.usuario.nombreUsuario ||
      !this.usuario.rol || !this.usuario.sucursalId
    ) {
      Swal.fire('Campos incompletos', 'Completá todos los campos', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Actualizar usuario?',
      text: 'Se sobrescribirán los datos actuales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.usuarioService.actualizarUsuario(this.usuarioId, this.usuario).subscribe({
          next: (usuarioActualizado) => {
            Swal.fire({
              title: 'Usuario actualizado',
              html: `
                <p><strong>Nombre:</strong> ${usuarioActualizado.nombre} ${usuarioActualizado.apellido}</p>
                <p><strong>Usuario:</strong> ${usuarioActualizado.nombreUsuario}</p>
                <p><strong>Rol:</strong> ${usuarioActualizado.rol}</p>
              `,
              icon: 'success',
              confirmButtonText: 'Volver al Dashboard'
            }).then(() => {
              this.router.navigate(['/superadmin/dashboard']);
            });
          },
          error: () => Swal.fire('Error', 'No se pudo actualizar el usuario', 'error')
        });
      }
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
