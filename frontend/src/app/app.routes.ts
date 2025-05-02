import { Routes } from '@angular/router';
import { DashboardComponent } from './superadmin/dashboard/dashboard.component';
import { CrearEmpresaComponent } from './superadmin/crear-empresa/crear-empresa.component';
import { VerEmpresasComponent } from './superadmin/ver-empresas/ver-empresas.component';
import { AgregarSucursalComponent } from './superadmin/agregar-sucursal/agregar-sucursal.component';
import { VerSucursalesComponent } from './superadmin/ver-sucursales/ver-sucursales.component';
import { EditarEmpresaComponent } from './superadmin/editar-empresa/editar-empresa.component';
import { EditarSucursalComponent } from './superadmin/editar-sucursal/editar-sucursal.component';
import { CrearUsuarioComponent } from './superadmin/crear-usuario/crear-usuario.component';
import { VerUsuariosComponent } from './superadmin/ver-usuarios/ver-usuarios.component';
import { EditarUsuarioComponent } from './superadmin/editar-usuario/editar-usuario.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: 'superadmin/editar-sucursal/:id', component: EditarSucursalComponent },
  { path: 'superadmin/editar-empresa/:id', component: EditarEmpresaComponent },
  { path: 'superadmin/ver-sucursales', component: VerSucursalesComponent },
  { path: 'superadmin/agregar-sucursal', component: AgregarSucursalComponent },
  { path: 'superadmin/ver-empresas', component: VerEmpresasComponent },
  { path: 'superadmin/crear-empresa', component: CrearEmpresaComponent },
  { path: 'superadmin/dashboard', component: DashboardComponent },
  { path: 'superadmin/crear-usuario', component: CrearUsuarioComponent },
  { path: 'superadmin/ver-usuarios', component: VerUsuariosComponent },
  { path: 'superadmin/editar-usuario/:id', component: EditarUsuarioComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'superadmin/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'superadmin/dashboard' }
];


/*, canActivate: [authGuard]*/