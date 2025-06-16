import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

//================ [SUPERADMIN] ================//
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

//================ [ADMIN] ================//
import { AdminComponent } from './admin/dashboard/dashboard.component';
import { GestionarEmpleadosComponent } from './admin/gestionar-empleados/gestionar-empleados.component';
import { GestionarCategoriasComponent } from './admin/gestionar-categorias/gestionar-categorias.component';
import { GestionarProductosComponent } from './admin/gestionar-productos/gestionar-productos.component';
import { GestionarLotesComponent } from './admin/gestionar-lotes/gestionar-lotes.component';
import { GestionarProveedoresComponent } from './admin/gestionar-proveedores/gestionar-proveedores.component';
import { GestionarConteosComponent } from './admin/gestionar-conteos/gestionar-conteos.component';
import { UnirseConteoLibreComponent } from './admin/unirse-conteo-libre/unirse-conteo-libre.component';
import { ReporteConteoComponent } from './admin/reporte-conteo/reporte-conteo.component';
import { EstadisticasComponent } from './admin/estadisticas/estadisticas.component';

//================ [EMPLEADO] ================//
import { EmpleadoComponent } from './empleado/dashboard/dashboard.component';
import { ConteoLibreComponent } from './empleado/conteo-libre/conteo-libre.component';

import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  {
    path: 'superadmin/editar-sucursal/:id',
    component: EditarSucursalComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/editar-empresa/:id',
    component: EditarEmpresaComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/ver-sucursales',
    component: VerSucursalesComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/agregar-sucursal',
    component: AgregarSucursalComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/ver-empresas',
    component: VerEmpresasComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/crear-empresa',
    component: CrearEmpresaComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/crear-usuario',
    component: CrearUsuarioComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/ver-usuarios',
    component: VerUsuariosComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'superadmin/editar-usuario/:id',
    component: EditarUsuarioComponent,
    canActivate: [authGuard],
    data: { role: 'SUPERADMINISTRADOR' }
  },
  {
    path: 'admin/dashboard',
    component: AdminComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-empleados',
    component: GestionarEmpleadosComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-categorias',
    component: GestionarCategoriasComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-productos',
    component: GestionarProductosComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-lotes',
    component: GestionarLotesComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-proveedores',
    component: GestionarProveedoresComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-conteos',
    component: GestionarConteosComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/gestionar-conteos/unirse-conteo-libre/:id',
    component: UnirseConteoLibreComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/reporte-conteo/:id',
    component: ReporteConteoComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'admin/estadisticas',
    component: EstadisticasComponent,
    canActivate: [authGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  {
    path: 'empleado/dashboard',
    component: EmpleadoComponent,
    canActivate: [authGuard],
    data: { role: 'EMPLEADO' }
  },
  {
    path: 'empleado/conteo-libre/:id',
    component: ConteoLibreComponent,
    canActivate: [authGuard],
    data: { role: 'EMPLEADO' }
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    redirectTo: 'superadmin/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'superadmin/dashboard'
  }
];