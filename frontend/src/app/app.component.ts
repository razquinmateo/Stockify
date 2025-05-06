import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// 👉 Componentes standalone usados en el routing
import { DashboardComponent } from './superadmin/dashboard/dashboard.component';
import { CrearEmpresaComponent } from './superadmin/crear-empresa/crear-empresa.component';
import { EditarEmpresaComponent } from './superadmin/editar-empresa/editar-empresa.component';
import { AgregarSucursalComponent } from './superadmin/agregar-sucursal/agregar-sucursal.component';
import { VerSucursalesComponent } from './superadmin/ver-sucursales/ver-sucursales.component';
import { EditarSucursalComponent } from './superadmin/editar-sucursal/editar-sucursal.component';
import { CrearUsuarioComponent } from './superadmin/crear-usuario/crear-usuario.component';
import { VerUsuariosComponent } from './superadmin/ver-usuarios/ver-usuarios.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DashboardComponent,
    CrearEmpresaComponent,
    EditarEmpresaComponent,
    AgregarSucursalComponent,
    VerSucursalesComponent,
    EditarSucursalComponent,
    CrearUsuarioComponent,
    VerUsuariosComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'stockify-frontend';
}
