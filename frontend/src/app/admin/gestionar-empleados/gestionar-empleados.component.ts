import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestionar-empleados.component.html',
  styleUrls: ['./gestionar-empleados.component.css']
})
export class GestionarEmpleadosComponent implements OnInit {
  empleados: Usuario[] = [];
  empleadoSeleccionado!: Usuario;
  esEditar: boolean = false;
  nuevaContrasenia: string = '';
  confirmarContrasenia: string = '';

  filtro: string = '';
  paginaActual: number = 1;
  empleadosPorPagina: number = 5;
  nombreUsuarioLogueado: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.empleadoSeleccionado = this.resetEmpleado();
    this.cargarEmpleados();
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  cargarEmpleados(): void {
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      this.usuarioService.getEmpleados().subscribe({
        next: (data) => {
          this.empleados = data.filter(emp => emp.sucursalId === sucursalId);
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los empleados. Inténtalo de nuevo.',
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo determinar la sucursal del administrador.',
      });
    }
  }

  abrirModalAgregar(): void {
    this.esEditar = false;
    this.empleadoSeleccionado = this.resetEmpleado();
    this.mostrarModal();
  }

  editarEmpleado(emp: Usuario): void {
    this.esEditar = true;
    this.empleadoSeleccionado = { ...emp };
    this.mostrarModal();
  }

  abrirModalResetPassword(): void {
    this.nuevaContrasenia = '';
    this.confirmarContrasenia = '';
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
  }

  reestablecerContrasenia(): void {
    if (this.nuevaContrasenia !== this.confirmarContrasenia) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
      });
      return;
    }

    if (this.nuevaContrasenia.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
    this.usuarioService.resetPassword(this.empleadoSeleccionado.id, this.nuevaContrasenia).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Contraseña reestablecida correctamente',
          timer: 1500,
          showConfirmButton: false
        });
        modal.hide();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo reestablecer la contraseña. Inténtalo de nuevo.',
        });
      }
    });
  }

  toggleEstadoEmpleado(emp: Usuario): void {
    const accion = emp.activo ? 'deshabilitar' : 'activar';
    Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este empleado?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevoEstado = !emp.activo;
        const empleadoActualizado = { ...emp, activo: nuevoEstado };
        this.usuarioService.actualizar(emp.id, empleadoActualizado).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: `Empleado ${accion}do correctamente`,
              timer: 1500,
              showConfirmButton: false
            });
            this.cargarEmpleados();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `No se pudo ${accion} el empleado. Inténtalo de nuevo.`,
            });
          }
        });
      }
    });
  }

  guardarEmpleado(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('empleadoModal'));
    const accion = this.esEditar ? 'actualizado' : 'agregado';

    if (!this.esEditar) {
      this.empleadoSeleccionado.sucursalId = this.authService.getSucursalId() || 0;
    }

    if (this.esEditar) {
      this.usuarioService.actualizar(this.empleadoSeleccionado.id, this.empleadoSeleccionado).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: `Empleado ${accion} correctamente`,
            timer: 1500,
            showConfirmButton: false
          });
          modal.hide();
          this.cargarEmpleados();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo ${accion} el empleado. Inténtalo de nuevo.`,
          });
        }
      });
    } else {
      this.usuarioService.crear(this.empleadoSeleccionado).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: `Empleado ${accion} correctamente`,
            timer: 1500,
            showConfirmButton: false
          });
          modal.hide();
          this.cargarEmpleados();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo ${accion} el empleado. Inténtalo de nuevo.`,
          });
        }
      });
    }
  }

  mostrarModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('empleadoModal'));
    modal.show();
  }

  resetEmpleado(): Usuario {
    return {
      id: 0,
      nombre: '',
      apellido: '',
      nombreUsuario: '',
      contrasenia: '',
      rol: 'EMPLEADO',
      sucursalId: this.authService.getSucursalId() || 0,
      activo: true
    };
  }

  filtrarEmpleados(): Usuario[] {
    return this.empleados.filter(emp =>
      emp.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      emp.apellido.toLowerCase().includes(this.filtro.toLowerCase()) ||
      emp.nombreUsuario.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  obtenerEmpleadosPaginados(): Usuario[] {
    const inicio = (this.paginaActual - 1) * this.empleadosPorPagina;
    return this.filtrarEmpleados().slice(inicio, inicio + this.empleadosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.filtrarEmpleados().length / this.empleadosPorPagina);
  }
}