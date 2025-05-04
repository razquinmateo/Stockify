import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../services/usuario.service';

declare var bootstrap: any;

@Component({
  selector: 'app-gestionar-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestionar-empleados.component.html',
  styleUrl: './gestionar-empleados.component.css'
})
export class GestionarEmpleadosComponent implements OnInit {
  empleados: Usuario[] = [];
  empleadoSeleccionado: Usuario = this.resetEmpleado();
  esEditar: boolean = false;

    constructor(private usuarioService: UsuarioService) {}

    ngOnInit(): void {
      this.cargarEmpleados();
    }

    cargarEmpleados(): void {
      this.usuarioService.getEmpleados().subscribe(data => this.empleados = data);
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

    /* deshabilitarEmpleado(id: number): void {
      if (confirm('¿Estás seguro que deseas deshabilitar este empleado?')) {
        this.usuarioService.deshabilitar(id).subscribe(() => this.cargarEmpleados());
      }
    } */

    toggleEstadoEmpleado(emp: Usuario): void {
      const accion = emp.activo ? 'deshabilitar' : 'activar';
      if (confirm(`¿Estás seguro que deseas ${accion} este empleado?`)) {
        const nuevoEstado = !emp.activo;
        const empleadoActualizado = { ...emp, activo: nuevoEstado };
        this.usuarioService.actualizar(emp.id, empleadoActualizado).subscribe(() => {
          this.cargarEmpleados();
        });
      }
    }

    guardarEmpleado(): void {
      const modal = bootstrap.Modal.getInstance(document.getElementById('empleadoModal'));

      if (this.esEditar) {
        this.usuarioService.actualizar(this.empleadoSeleccionado.id, this.empleadoSeleccionado)
          .subscribe(() => {
            modal.hide();
            this.cargarEmpleados();
          });
      } else {
        this.usuarioService.crear(this.empleadoSeleccionado)
          .subscribe(() => {
            modal.hide();
            this.cargarEmpleados();
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
        sucursalId: 0,
        activo: true
      };
    }
}
