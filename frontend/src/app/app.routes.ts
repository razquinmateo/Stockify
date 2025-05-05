import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
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
  { path: 'superadmin/editar-sucursal/:id', component: EditarSucursalComponent, canActivate: [authGuard] },
  { path: 'superadmin/editar-empresa/:id', component: EditarEmpresaComponent, canActivate: [authGuard] },
  { path: 'superadmin/ver-sucursales', component: VerSucursalesComponent, canActivate: [authGuard] },
  { path: 'superadmin/agregar-sucursal', component: AgregarSucursalComponent, canActivate: [authGuard] },
  { path: 'superadmin/ver-empresas', component: VerEmpresasComponent, canActivate: [authGuard] },
  { path: 'superadmin/crear-empresa', component: CrearEmpresaComponent, canActivate: [authGuard] },
  { path: 'superadmin/dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'superadmin/crear-usuario', component: CrearUsuarioComponent, canActivate: [authGuard] },
  { path: 'superadmin/ver-usuarios', component: VerUsuariosComponent, canActivate: [authGuard] },
  { path: 'superadmin/editar-usuario/:id', component: EditarUsuarioComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'superadmin/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'superadmin/dashboard' }
];


/*, canActivate: [authGuard]*/