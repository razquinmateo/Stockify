import { Injectable } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //verificamos si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  //obtenemos el rol requerido de la ruta
  const requiredRole = route.data['role'];
  const currentRole = authService.getUserRole();  //obtenemos el rol actual del usuario
  
  //verificamos si el rol del usuario coincide con el rol requerido para esta ruta
  if (requiredRole && requiredRole !== currentRole) {
    //redirigimos según el rol actual del usuario
    switch (currentRole) {
      case 'SUPERADMINISTRADOR':
        router.navigate(['/superadmin/dashboard']);
        break;
      case 'ADMINISTRADOR':
        router.navigate(['/admin']);
        break;
      case 'EMPLEADO':
        router.navigate(['/empleado']);
        break;
      default:
        router.navigate(['/login']);  //redirigimos al login si el rol no es reconocido
        break;
    }
    return false;  //si el rol no coincide, no permitimos el acceso
  }

  return true;  //si el rol coincide, permitimos el acceso
};
