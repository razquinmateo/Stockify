// src/environments/environment.ts
export const environment = {
    production: false,

    /**
     * Devuelve la URL de la API según el host de la aplicación.
     */
    apiUrl: ((): string => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8080/Stockify/api/v1';
        } else {
            return `http://${hostname}:8080/Stockify/api/v1`;
        }
    })(),

    /**
     * Devuelve la URL del WebSocket según el host de la aplicación.
     */
    wsUrl: ((): string => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'ws://localhost:8080/Stockify/ws/websocket';
        } else {
            return `ws://${hostname}:8080/Stockify/ws/websocket`;
        }
    })()
};