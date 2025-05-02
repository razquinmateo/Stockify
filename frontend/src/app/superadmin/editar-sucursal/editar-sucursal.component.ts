import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalService, Sucursal } from '../../services/sucursal.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-editar-sucursal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-sucursal.component.html',
  styleUrls: ['./editar-sucursal.component.css']
})
export class EditarSucursalComponent implements OnInit {
  sucursalId!: number;
  sucursal: Partial<Sucursal> = {
    nombre: '',
    direccion: '',
    telefono: ''
  };

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private sucursalService: SucursalService
  ) {}
  
  ngOnInit(): void {
    this.sucursalId = Number(this.route.snapshot.paramMap.get('id'));
    this.sucursalService.getSucursalById(this.sucursalId).subscribe({
      next: (data) => this.sucursal = data,
      error: () => Swal.fire('Error', 'No se pudo cargar la sucursal', 'error')
    });
  }

  guardarCambios(): void {
    if (!this.sucursal.nombre || !this.sucursal.direccion || !this.sucursal.telefono) {
      Swal.fire('Campos incompletos', 'Completá todos los campos', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Actualizar sucursal?',
      text: 'Se sobrescribirán los datos actuales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.sucursalService.actualizarSucursal(this.sucursalId, this.sucursal).subscribe({
          next: (sucursalActualizada) => {
            Swal.fire({
              title: 'Sucursal actualizada',
              html: `
                <p><strong>Nombre:</strong> ${sucursalActualizada.nombre}</p>
                <p><strong>Dirección:</strong> ${sucursalActualizada.direccion}</p>
                <p><strong>Teléfono:</strong> ${sucursalActualizada.telefono || '-'}</p>
              `,
              icon: 'success',
              confirmButtonText: 'Volver al Dashboard'
            }).then(() => {
              this.router.navigate(['/superadmin/dashboard']);
            });
          },
          error: () => Swal.fire('Error', 'No se pudo actualizar la sucursal', 'error')
        });
      }
    });
  }  
  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
