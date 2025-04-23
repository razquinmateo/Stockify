import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SuperadminComponent } from './superadmin/superadmin.component';
import { AdminComponent } from './admin/admin.component';
import { EmpleadoComponent } from './empleado/empleado.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'superadmin', component: SuperadminComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'empleado', component: EmpleadoComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];