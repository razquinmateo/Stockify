// 1) Polyfill global para las librerías que lo requieran
; (window as any).global = window

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/auth.interceptor';
import { registerLocaleData } from '@angular/common';
import localeEsUy from '@angular/common/locales/es-UY';

registerLocaleData(localeEsUy, 'es-UY');

bootstrapApplication(AppComponent, {
  providers: [
    { provide: 'LOCALE_ID', useValue: 'es-UY' },
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideRouter(routes)
  ]
});