import { Injectable, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = new AuthService(inject(HttpClient));
  const token = authService.getToken();
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  return next(req);
};
