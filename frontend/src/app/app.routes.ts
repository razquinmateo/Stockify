import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SuperadminComponent } from './superadmin/superadmin.component';
import { AdminComponent } from './admin/admin.component';
import { EmpleadoComponent } from './empleado/empleado.component';
import { authGuard } from './auth.guard';
import { GestionarEmpleadosComponent } from './admin/gestionar_empleados/gestionar-empleados.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'superadmin', component: SuperadminComponent, canActivate: [authGuard] },

  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'admin/gestionar_empleados', component: GestionarEmpleadosComponent, canActivate: [authGuard] },

  { path: 'empleado', component: EmpleadoComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
