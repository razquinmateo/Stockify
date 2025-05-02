import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-editar-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-empresa.component.html',
  styleUrls: ['./editar-empresa.component.css']
})
export class EditarEmpresaComponent implements OnInit {
  empresaId!: number;
  empresa: Partial<Empresa> = {
    nombre: '',
    rut: '',
    direccion: '',
    telefono: ''
  };

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.empresaId = Number(this.route.snapshot.paramMap.get('id'));
    this.empresaService.getEmpresaById(this.empresaId).subscribe({
      next: (data) => this.empresa = data,
      error: () => Swal.fire('Error', 'No se pudo cargar la empresa', 'error')
    });
  }

  guardarCambios(): void {
    if (!this.empresa.nombre || !this.empresa.rut || !this.empresa.direccion || !this.empresa.telefono) {
      Swal.fire('Campos incompletos', 'Completá todos los campos', 'warning');
      return;
    }

    // 🟡 Confirmación antes de actualizar
    Swal.fire({
      title: '¿Actualizar empresa?',
      text: 'Se sobrescribirán los datos actuales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.empresaService.actualizarEmpresa(this.empresaId, this.empresa).subscribe({
          next: (empresaActualizada) => {
            // 🟢 Confirmación luego de actualizar con datos
            Swal.fire({
              title: 'Empresa actualizada',
              html: `
                <p><strong>Nombre:</strong> ${empresaActualizada.nombre}</p>
                <p><strong>RUT:</strong> ${empresaActualizada.rut}</p>
                <p><strong>Dirección:</strong> ${empresaActualizada.direccion}</p>
                <p><strong>Teléfono:</strong> ${empresaActualizada.telefono}</p>
              `,
              icon: 'success',
              confirmButtonText: 'Volver al Dashboard'
            }).then(() => {
              this.router.navigate(['/superadmin/dashboard']);
            });
          },
          error: () => Swal.fire('Error', 'No se pudo actualizar la empresa', 'error')
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
