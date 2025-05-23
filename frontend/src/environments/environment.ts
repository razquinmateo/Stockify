// src/environments/environment.ts
export const environment = {
    production: false,

    /**
     * Devuelve la URL de la API según el host de la aplicación.
     * Si corre en localhost, usa el backend local; en otro caso (ngrok), usa la URL remota.
     */
    apiUrl: ((): string => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8080/Stockify/api/v1';
        } else {
            return 'https://03cb-2800-a4-1a66-a700-dcef-3753-2e3-8a0.ngrok-free.app/Stockify/api/v1';
        }
    })()
};
