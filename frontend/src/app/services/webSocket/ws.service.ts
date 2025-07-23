// src/app/services/ws.service.ts
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConteoMensaje {
  id: number;
  fechaHora: string;
  tipoConteo: 'LIBRE' | 'CATEGORIAS';
}

export interface ConteoProductoMensaje {
    id: number;
    conteoId: number;
    productoId: number;
    cantidadEsperada: number;
    cantidadContada: number | null;
    precioActual: number;
    activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class WsService {
    private client: Client;
    private conteoActivo$ = new Subject<ConteoMensaje>();
    private conteoFinalizado$ = new Subject<ConteoMensaje>();
    private conteoProductoActualizado$ = new Subject<ConteoProductoMensaje>(); 
    private subActivo?: StompSubscription;
    private subFinalizado?: StompSubscription;
    private subConteoProducto?: StompSubscription;

    constructor() {
        // 1) Crea el cliente STOMP usando WebSocket nativo
        this.client = new Client({
            brokerURL: environment.wsUrl,
            reconnectDelay: 5000,
            heartbeatIncoming: 0,
            heartbeatOutgoing: 20000,
        });

        // 2) Al conectar, subscribe a ambos topics
        this.client.onConnect = () => {
            this.subActivo = this.client.subscribe(
                '/topic/conteo-activo',
                (msg: IMessage) => {
                    const body = JSON.parse(msg.body) as ConteoMensaje;
                    this.conteoActivo$.next(body);
                }
            );
            this.subFinalizado = this.client.subscribe(
                '/topic/conteo-finalizado',
                (msg: IMessage) => {
                    const body = JSON.parse(msg.body) as ConteoMensaje;
                    this.conteoFinalizado$.next(body);
                }
            );
            this.subConteoProducto = this.client.subscribe(
                '/topic/conteo-producto-actualizado',
                (msg: IMessage) => {
                    const body = JSON.parse(msg.body) as ConteoProductoMensaje;
                    this.conteoProductoActualizado$.next(body);
                }
            );
        };

        // 3) Arranca la conexión
        this.client.activate();
    }

    /** Emite cuando el conteo inicia */
    onConteoActivo(): Observable<ConteoMensaje> {
        return this.conteoActivo$.asObservable();
    }

    /** Emite cuando el conteo se finaliza */
    onConteoFinalizado(): Observable<ConteoMensaje> {
        return this.conteoFinalizado$.asObservable();
    }

    onConteoProductoActualizado(): Observable<ConteoProductoMensaje> {
        return this.conteoProductoActualizado$.asObservable();
    }

    /** Desconecta y limpia subscripciones */
    disconnect() {
        this.subActivo?.unsubscribe();
        this.subFinalizado?.unsubscribe();
        this.subConteoProducto?.unsubscribe();
        this.client.deactivate();
    }
}