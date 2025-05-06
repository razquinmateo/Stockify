import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { SucursalService } from '../../services/sucursal.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-agregar-sucursal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agregar-sucursal.component.html',
  styleUrls: ['./agregar-sucursal.component.css']
})
export class AgregarSucursalComponent implements OnInit {
  empresas: Empresa[] = [];
  filtro = '';
  empresaSeleccionada: Empresa | null = null;

  sucursal = {
    nombre: '',
    direccion: '',
    telefono: ''
  };

  currentPage = 1;
  itemsPerPage = 5;

  constructor(
    private authService: AuthService,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data) => this.empresas = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error')
    });
  }

  seleccionarEmpresa(empresa: Empresa) {
    this.empresaSeleccionada = empresa;
  }

  guardarSucursal() {
    if (!this.sucursal.nombre || !this.sucursal.direccion || !this.empresaSeleccionada) {
      Swal.fire('Campos incompletos', 'Completá todos los campos', 'warning');
      return;
    }

    this.sucursalService.crearSucursal({
      nombre: this.sucursal.nombre,
      direccion: this.sucursal.direccion,
      telefono: this.sucursal.telefono,
      empresaId: this.empresaSeleccionada.id
    }).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Sucursal agregada correctamente', 'success');
        this.empresaSeleccionada = null;
        this.sucursal = { nombre: '', direccion: '', telefono: '' };
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la sucursal', 'error')
    });
  }

  filtrarEmpresasSinPaginar(): Empresa[] {
    return this.empresas.filter(e =>
      e.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      e.rut.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  filtrarEmpresas(): Empresa[] {
    const inicio = (this.currentPage - 1) * this.itemsPerPage;
    return this.filtrarEmpresasSinPaginar().slice(inicio, inicio + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filtrarEmpresasSinPaginar().length / this.itemsPerPage);
  }


  cerrarSesion(): void {
    console.log('🔒 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
