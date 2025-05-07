import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-crear-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-empresa.component.html',
  styleUrls: ['./crear-empresa.component.css']
})

export class CrearEmpresaComponent {
  empresa: Partial<Empresa> = {
    nombre: '',
    rut: '',
    direccion: '',
    telefono: ''
  };
  nombreUsuarioLogueado: string = '';

  constructor(private empresaService: EmpresaService, private router: Router, private authService: AuthService,) {}

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
  }
  

  crear(): void {
    if (!this.empresa.nombre || !this.empresa.rut || !this.empresa.direccion || !this.empresa.telefono) {
      Swal.fire('Campos incompletos', 'Por favor completá todos los campos.', 'warning');
      return;
    }

    this.empresaService.crearEmpresa(this.empresa).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Empresa creada correctamente', 'success').then(() => {
          this.router.navigate(['/superadmin/dashboard']);
        });
      },
      error: () => Swal.fire('Error', 'No se pudo crear la empresa', 'error')
    });
  }

  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
