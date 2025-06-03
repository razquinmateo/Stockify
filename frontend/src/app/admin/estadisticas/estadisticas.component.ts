// src/app/admin/estadisticas/estadisticas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { EstadisticasService } from '../../services/estadisticas.service';
import { AuthService } from '../../auth.service';
import { Router, RouterModule } from '@angular/router';

import {
    EstadisticaProductoVendidos,
    EstadisticaProductoFaltante,
    EstadisticaDineroFaltanteMes,
    EstadisticaDineroSobranteMes,
    EstadisticaCategoriaVendida
} from './estadisticas.model';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    selector: 'app-estadisticas',
    templateUrl: './estadisticas.component.html',
    styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements OnInit {
    // ----------------------------------------------------
    // 1) Variables de filtro de fechas (gráficos 1–3)
    // ----------------------------------------------------
    fechaDesde: string = '';
    fechaHasta: string = '';
    nombreUsuarioLogueado = '';

    // ----------------------------------------------------
    // 2) Datos que vendrán del servicio
    // ----------------------------------------------------
    masVendidos: EstadisticaProductoVendidos[] = [];
    masFaltaron: EstadisticaProductoFaltante[] = [];
    dineroFaltanteMes: EstadisticaDineroFaltanteMes[] = [];
    dineroSobranteMes: EstadisticaDineroSobranteMes[] = [];
    categoriasVendidas: EstadisticaCategoriaVendida[] = [];

    // ----------------------------------------------------
    // 3) Instancias de Chart.js
    // ----------------------------------------------------
    chartMasVendidos!: Chart;
    chartMasFaltaron!: Chart;
    chartDineroCombinado!: Chart;
    chartCategoriasVendidas!: Chart;

    loading: boolean = false;
    errorMsg: string | null = null;

    // Guardar el año actual para pasar al backend
    anioActual: number = new Date().getFullYear();

    constructor(
        private estadisticasService: EstadisticasService,
        public authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Obtener usuario desde el token
        this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();

        // Inicializamos los filtros "desde/hasta" (primer día del mes y hoy)
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaDesde = this.formatDate(primerDia);
        this.fechaHasta = this.formatDate(hoy);

        // Llamamos a los tres primeros gráficos:
        this.consultarEstadisticas();

        // Llamamos a la función que trae tanto faltante como sobrante y dibuja el gráfico combinado
        this.consultarDineroPorMesCombinado();
    }

    /** Convierte un objeto Date a cadena “YYYY-MM-DD” */
    private formatDate(fecha: Date): string {
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    /**
     * 1)–3) Consulta Productos más vendidos, faltantes y categorías vendidas
     */
    consultarEstadisticas(): void {
        if (!this.fechaDesde || !this.fechaHasta) {
            this.errorMsg = 'Debe seleccionar ambas fechas.';
            return;
        }
        if (this.fechaDesde > this.fechaHasta) {
            this.errorMsg = 'La fecha “Desde” no puede ser mayor que la “Hasta”.';
            return;
        }
        this.errorMsg = null;
        this.loading = true;

        const desde = this.fechaDesde;
        const hasta = this.fechaHasta;

        // --- 1) Productos más vendidos ---
        this.estadisticasService.getProductosMasVendidos(desde, hasta).subscribe({
            next: (data) => {
                this.masVendidos = data;
                if (this.masVendidos.length > 0) {
                    // Asegurarnos de que el <canvas> esté en el DOM
                    setTimeout(() => this.generarGraficoMasVendidos(), 0);
                }
            },
            error: (err) => {
                console.error('Error al obtener más vendidos:', err);
                this.errorMsg = 'No se pudieron cargar los productos más vendidos.';
            }
        });

        // --- 2) Productos con mayor faltante ---
        this.estadisticasService.getProductosMasFaltaron(desde, hasta).subscribe({
            next: (data) => {
                this.masFaltaron = data;
                if (this.masFaltaron.length > 0) {
                    setTimeout(() => this.generarGraficoMasFaltaron(), 0);
                }
            },
            error: (err) => {
                console.error('Error al obtener faltantes:', err);
                this.errorMsg = 'No se pudieron cargar los productos con faltante.';
            },
            complete: () => {
                this.loading = false;
            }
        });

        // --- 3) Categorías más vendidas ---
        this.estadisticasService.getCategoriasMasVendidas(desde, hasta).subscribe({
            next: (data: EstadisticaCategoriaVendida[]) => {
                this.categoriasVendidas = data;
                if (this.categoriasVendidas.length > 0) {
                    setTimeout(() => this.generarGraficoCategoriasVendidas(), 0);
                }
            },
            error: (err) => {
                console.warn('No se cargaron “categorías vendidas”: ', err);
            }
        });
    }

    /**
     * 4) Trae DINERO FALTANTE y SOBRANTE por mes (año actual)
     *    y genera un solo gráfico con dos líneas: faltante y sobrante
     */
    consultarDineroPorMesCombinado(): void {
        // Primero traemos el dinero faltante
        this.estadisticasService.getDineroFaltantePorMes(this.anioActual).subscribe({
            next: (dataFaltante: EstadisticaDineroFaltanteMes[]) => {
                this.dineroFaltanteMes = dataFaltante;

                // Una vez que tenemos falta­nte, traemos el sobrante
                this.estadisticasService.getDineroSobrantePorMes(this.anioActual).subscribe({
                    next: (dataSobrante: EstadisticaDineroSobranteMes[]) => {
                        this.dineroSobranteMes = dataSobrante;

                        // Si al menos uno de los dos arreglos tiene datos, dibujamos el gráfico combinado
                        if (
                            this.dineroFaltanteMes.length > 0 ||
                            this.dineroSobranteMes.length > 0
                        ) {
                            setTimeout(() => this.generarGraficoDineroCombinado(), 0);
                        }
                    },
                    error: (err) => {
                        console.warn('No se cargó “dinero sobrante por mes”: ', err);
                        // Aún si el sobrante falla, podemos dibujar “solo faltante” si existiera.
                        if (this.dineroFaltanteMes.length > 0) {
                            setTimeout(() => this.generarGraficoDineroCombinado(), 0);
                        }
                    }
                });
            },
            error: (err) => {
                console.warn('No se cargó “dinero faltante por mes”: ', err);
            }
        });
    }

    /** 1) Gráfico “Productos más vendidos” */
    private generarGraficoMasVendidos(): void {
        if (this.chartMasVendidos) {
            this.chartMasVendidos.destroy();
        }
        const labels = this.masVendidos.map(item => item.nombreProducto);
        const valores = this.masVendidos.map(item => item.cantidadVendida);

        const canvas = document.getElementById('graficoVendidos') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartMasVendidos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Unidades vendidas',
                        data: valores,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    /** 2) Gráfico “Productos con mayor faltante” */
    private generarGraficoMasFaltaron(): void {
        if (this.chartMasFaltaron) {
            this.chartMasFaltaron.destroy();
        }
        const labels = this.masFaltaron.map(item => item.nombreProducto);
        const valores = this.masFaltaron.map(item => item.cantidadFaltante);

        const canvas = document.getElementById('graficoFaltantes') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartMasFaltaron = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Unidades faltantes',
                        data: valores,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    /**
     * 4) Gráfico combinado “Dinero faltante y sobrante por mes” (líneas)
     */
    private generarGraficoDineroCombinado(): void {
        if (this.chartDineroCombinado) {
            this.chartDineroCombinado.destroy();
        }

        // 4.a) Definir orden de etiquetas: todos los meses del año (1 a 12).
        //     Convertimos a nombre: 1→"Ene", 2→"Feb", etc.
        const mesesNombre = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        const labels = mesesNombre;

        // 4.b) Construir un array de datos faltante y sobrante de longitud 12.
        //     Si en algún mes no hay fila, se asigna 0.
        const datosFaltantePorMes = new Array<number>(12).fill(0);
        this.dineroFaltanteMes.forEach(item => {
            const idx = item.mes - 1; // item.mes viene de 1..12
            if (idx >= 0 && idx < 12) {
                datosFaltantePorMes[idx] = item.totalFaltante;
            }
        });

        const datosSobrantePorMes = new Array<number>(12).fill(0);
        this.dineroSobranteMes.forEach(item => {
            const idx = item.mes - 1;
            if (idx >= 0 && idx < 12) {
                datosSobrantePorMes[idx] = item.totalSobrante;
            }
        });

        const canvas = document.getElementById('graficoDinero') as HTMLCanvasElement;
        if (!canvas) {
            console.warn('No se encontró el canvas #graficoDinero');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('No se pudo obtener el contexto 2D para #graficoDinero');
            return;
        }

        this.chartDineroCombinado = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Dinero faltante',
                        data: datosFaltantePorMes,
                        fill: false,
                        tension: 0.3,
                        borderColor: 'rgba(255, 99, 132, 0.8)',
                        pointBackgroundColor: 'rgba(255, 99, 132, 0.8)'
                    },
                    {
                        label: 'Dinero sobrante',
                        data: datosSobrantePorMes,
                        fill: false,
                        tension: 0.3,
                        borderColor: 'rgba(75, 192, 75, 0.8)',
                        pointBackgroundColor: 'rgba(75, 192, 75, 0.8)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    /** 5) Gráfico “Categorías más vendidas” */
    private generarGraficoCategoriasVendidas(): void {
        if (this.chartCategoriasVendidas) {
            this.chartCategoriasVendidas.destroy();
        }
        const labels = this.categoriasVendidas.map(item => item.nombreCategoria);
        const valores = this.categoriasVendidas.map(item => item.cantidadVendida);

        const canvas = document.getElementById('graficoCategoriasVendidas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartCategoriasVendidas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Unidades vendidas (categoría)',
                        data: valores,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}
