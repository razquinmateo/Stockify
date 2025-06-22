import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { EstadisticasService } from '../../services/estadisticas.service';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../auth.service';
import { Router, RouterModule } from '@angular/router';
import {
    EstadisticaProductoFaltante,
    EstadisticaProductoSobrante,
    EstadisticaDineroFaltanteMes,
    EstadisticaDineroSobranteMes,
    EstadisticaCategoriaFaltante,
    EstadisticaCategoriaSobrante
} from '../../models/estadisticas.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Observable } from 'rxjs';
import { Producto } from '../../services/producto.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    selector: 'app-estadisticas',
    templateUrl: './estadisticas.component.html',
    styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements OnInit {
    fechaDesde: string = '';
    fechaHasta: string = '';
    nombreUsuarioLogueado: string = '';
    sucursalId: number | null = null;
    limit: number = 10;

    masFaltaron: EstadisticaProductoFaltante[] = [];
    masSobrantes: EstadisticaProductoSobrante[] = [];
    dineroFaltanteMes: EstadisticaDineroFaltanteMes[] = [];
    dineroSobranteMes: EstadisticaDineroSobranteMes[] = [];
    categoriasFaltantes: EstadisticaCategoriaFaltante[] = [];
    categoriasSobrantes: EstadisticaCategoriaSobrante[] = [];

    chartMasFaltaron?: Chart;
    chartMasSobrantes?: Chart;
    chartDineroCombinado?: Chart;
    chartCategoriasFaltantes?: Chart;
    chartCategoriasSobrantes?: Chart;

    loading: boolean = false;
    errorMsg: string | null = null;
    anioActual: number = new Date().getFullYear();

    constructor(
        private estadisticasService: EstadisticasService,
        private productoService: ProductoService,
        public authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.authService.getNombreCompletoDesdeToken().subscribe({
            next: nombreCompleto => {
                this.nombreUsuarioLogueado = nombreCompleto;

                const sucursalId = this.authService.getSucursalId();
                if (sucursalId === null) {
                    this.errorMsg = 'No se pudo obtener la sucursal del usuario.';
                    return;
                }
                this.sucursalId = sucursalId;

                const hoy = new Date();
                const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                this.fechaDesde = this.formatDate(primerDia);
                this.fechaHasta = this.formatDate(hoy);

                this.consultarEstadisticas();
                this.consultarDineroPorMesCombinado();
            },
            error: err => {
                console.error('Error obteniendo el nombre completo del usuario:', err);
                this.errorMsg = 'No se pudo obtener el nombre del usuario.';
            }
        });
    }

    private formatDate(fecha: Date): string {
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    consultarEstadisticas(): void {
        if (!this.fechaDesde || !this.fechaHasta) {
            this.errorMsg = 'Debe seleccionar ambas fechas.';
            return;
        }
        if (this.fechaDesde > this.fechaHasta) {
            this.errorMsg = 'La fecha “Desde” no puede ser mayor que la “Hasta”.';
            return;
        }
        if (!this.sucursalId) {
            this.errorMsg = 'No se pudo determinar la sucursal del usuario.';
            return;
        }
        this.errorMsg = null;
        this.loading = true;

        const desde = this.fechaDesde;
        const hasta = this.fechaHasta;
        const sucursalId = this.sucursalId;

        this.estadisticasService.getProductosMasFaltaron(desde, hasta, sucursalId).subscribe({
            next: (data) => {
                this.masFaltaron = data;
                if (this.masFaltaron.length > 0) {
                    setTimeout(() => this.generarGraficoMasFaltaron(), 0);
                }
            },
            error: (err) => {
                console.error('Error al obtener faltantes:', err);
                this.errorMsg = 'No se pudieron cargar los productos con faltante.';
            }
        });

        this.estadisticasService.getProductosConMayorSobrante(desde, hasta, sucursalId).subscribe({
            next: (data) => {
                this.masSobrantes = data;
                if (this.masSobrantes.length > 0) {
                    setTimeout(() => this.generarGraficoMasSobrantes(), 0);
                }
            },
            error: (err) => {
                console.error('Error al obtener sobrantes:', err);
                this.errorMsg = 'No se pudieron cargar los productos con sobrante.';
            }
        });

        this.estadisticasService.getCategoriasConMayorFaltante(desde, hasta, sucursalId).subscribe({
            next: (data) => {
                this.categoriasFaltantes = data;
                if (this.categoriasFaltantes.length > 0) {
                    setTimeout(() => this.generarGraficoCategoriasFaltantes(), 0);
                }
            },
            error: (err) => {
                console.warn('No se cargaron “categorías faltantes”: ', err);
            }
        });

        this.estadisticasService.getCategoriasConMayorSobrante(desde, hasta, sucursalId).subscribe({
            next: (data) => {
                this.categoriasSobrantes = data;
                if (this.categoriasSobrantes.length > 0) {
                    setTimeout(() => this.generarGraficoCategoriasSobrantes(), 0);
                }
            },
            error: (err) => {
                console.warn('No se cargaron “categorías sobrantes”: ', err);
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    consultarDineroPorMesCombinado(): void {
        if (this.sucursalId === null) {
            this.errorMsg = 'No se pudo determinar la sucursal del usuario.';
            return;
        }

        const sucursalIdSeguro = this.sucursalId;

        this.estadisticasService.getDineroFaltantePorMes(this.anioActual, sucursalIdSeguro).subscribe({
            next: (dataFaltante) => {
                this.dineroFaltanteMes = dataFaltante;
                this.estadisticasService.getDineroSobrantePorMes(this.anioActual, sucursalIdSeguro).subscribe({
                    next: (dataSobrante) => {
                        this.dineroSobranteMes = dataSobrante;
                        if (this.dineroFaltanteMes.length > 0 || this.dineroSobranteMes.length > 0) {
                            setTimeout(() => this.generarGraficoDineroCombinado(), 0);
                        }
                    },
                    error: (err) => {
                        console.warn('No se cargó “dinero sobrante por mes”: ', err);
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

    private filterAndLimitData<T>(data: T[]): T[] {
        return data.slice(0, this.limit);
    }

    updateCharts(): void {
        if (this.masFaltaron.length > 0) this.generarGraficoMasFaltaron();
        if (this.masSobrantes.length > 0) this.generarGraficoMasSobrantes();
        if (this.categoriasFaltantes.length > 0) this.generarGraficoCategoriasFaltantes();
        if (this.categoriasSobrantes.length > 0) this.generarGraficoCategoriasSobrantes();
    }

    async downloadReport(): Promise<void> {
        try {
            this.loading = true;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Configurar fuente
            doc.setFont('helvetica', 'normal');

            // Encabezado
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Stockify', 14, 15);

            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('Reporte de Inventario', 14, 25);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 33);
            doc.text(`Período: ${this.fechaDesde} a ${this.fechaHasta}`, 14, 41);
            doc.text(`Generado por: ${this.nombreUsuarioLogueado}`, 14, 49);

            // Línea divisoria
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(14, 54, 196, 54);

            let yPosition = 64;

            // Resumen General
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumen General', 14, yPosition);
            yPosition += 8;

            const totalFaltantes = this.masFaltaron.reduce((sum, item) => sum + item.cantidadFaltante, 0);
            const totalSobrantes = this.masSobrantes.reduce((sum, item) => sum + item.cantidadSobrante, 0);
            const totalDineroFaltante = this.dineroFaltanteMes.reduce((sum, item) => sum + item.totalFaltante, 0);
            const totalDineroSobrante = this.dineroSobranteMes.reduce((sum, item) => sum + item.totalSobrante, 0);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Productos Faltantes: ${totalFaltantes} unidades`, 14, yPosition);
            yPosition += 8;
            doc.text(`Total Productos Sobrantes: ${totalSobrantes} unidades`, 14, yPosition);
            yPosition += 8;
            doc.text(`Dinero Faltante Total: $${totalDineroFaltante.toFixed(2)}`, 14, yPosition);
            yPosition += 8;
            doc.text(`Dinero Sobrante Total: $${totalDineroSobrante.toFixed(2)}`, 14, yPosition);
            yPosition += 10;

            // Línea divisoria
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(14, yPosition, 196, yPosition);
            yPosition += 10;

            if (this.masFaltaron.length > 0) {
                // Fetch productos for masFaltaron
                const productosFaltantesObs: Observable<Producto>[] = this.masFaltaron.map(item =>
                    this.productoService.obtenerProductoPorId(item.productoId)
                );
                const productosFaltantes = await forkJoin(productosFaltantesObs).toPromise();

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Productos con Mayor Faltante', 14, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Código Producto', 'Producto', 'Cantidad Faltante']],
                    body: this.masFaltaron.map((item, index) => [
                        productosFaltantes && productosFaltantes[index]?.codigoProducto || 'N/A',
                        item.nombreProducto,
                        item.cantidadFaltante
                    ]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [60, 60, 60],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 10,
                        textColor: [50, 50, 50]
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    columnStyles: {
                        0: { cellWidth: 40, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: {
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.masSobrantes.length > 0) {
                // Fetch productos for masSobrantes
                const productosSobrantesObs: Observable<Producto>[] = this.masSobrantes.map(item =>
                    this.productoService.obtenerProductoPorId(item.productoId)
                );
                const productosSobrantes = await forkJoin(productosSobrantesObs).toPromise();

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Productos con Mayor Sobrante', 14, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Código Producto', 'Producto', 'Cantidad Sobrante']],
                    body: this.masSobrantes.map((item, index) => [
                        productosSobrantes && productosSobrantes[index]?.codigoProducto || 'N/A',
                        item.nombreProducto,
                        item.cantidadSobrante
                    ]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [60, 60, 60],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 10,
                        textColor: [50, 50, 50]
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    columnStyles: {
                        0: { cellWidth: 40, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: {
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.categoriasFaltantes.length > 0) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Categorías con Mayor Faltante', 14, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['ID', 'Categoría', 'Cantidad Faltante']],
                    body: this.categoriasFaltantes.map(item => [item.categoriaId, item.nombreCategoria, item.cantidadFaltante]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [60, 60, 60],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 10,
                        textColor: [50, 50, 50]
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    columnStyles: {
                        0: { cellWidth: 20, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: {
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.categoriasSobrantes.length > 0) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Categorías con Mayor Sobrante', 14, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['ID', 'Categoría', 'Cantidad Sobrante']],
                    body: this.categoriasSobrantes.map(item => [item.categoriaId, item.nombreCategoria, item.cantidadSobrante]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [60, 60, 60],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 10,
                        textColor: [50, 50, 50]
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    columnStyles: {
                        0: { cellWidth: 20, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: {
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.dineroFaltanteMes.length > 0 || this.dineroSobranteMes.length > 0) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(`Dinero Faltante y Sobrante por Mes (${this.anioActual})`, 14, yPosition);
                yPosition += 8;

                const mesesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const body = mesesNombre.map((mes, idx) => {
                    const mesNum = idx + 1;
                    const faltante = this.dineroFaltanteMes.find(item => item.mes === mesNum)?.totalFaltante || 0;
                    const sobrante = this.dineroSobranteMes.find(item => item.mes === mesNum)?.totalSobrante || 0;
                    return [mes, `$${faltante.toFixed(2)}`, `$${sobrante.toFixed(2)}`];
                });

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Mes', 'Dinero Faltante', 'Dinero Sobrante']],
                    body: body,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [60, 60, 60],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 10,
                        textColor: [50, 50, 50]
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 50, halign: 'right' },
                        2: { cellWidth: 50, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: {
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            // Agregar pie de página a todas las páginas
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                this.addFooter(doc, i, pageCount);
            }

            doc.save(`Stockify_Report_Sucursal${this.sucursalId}_${this.fechaDesde}_${this.fechaHasta}.pdf`);
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.errorMsg = 'Error al generar el reporte PDF';
        } finally {
            this.loading = false;
        }
    }

    private addFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Página ${pageNumber} de ${totalPages}`, 196, pageHeight - 10, { align: 'right' });

        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 15, 196, pageHeight - 15);
    }

    private generarGraficoMasFaltaron(): void {
        if (this.chartMasFaltaron) {
            this.chartMasFaltaron.destroy();
        }
        const filteredData = this.filterAndLimitData(this.masFaltaron);
        const labels = filteredData.map(item => item.nombreProducto);
        const valores = filteredData.map(item => item.cantidadFaltante);

        const canvas = document.getElementById('graficoFaltantes') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartMasFaltaron = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Unidades faltantes',
                    data: valores,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }

    private generarGraficoMasSobrantes(): void {
        if (this.chartMasSobrantes) {
            this.chartMasSobrantes.destroy();
        }
        const filteredData = this.filterAndLimitData(this.masSobrantes);
        const labels = filteredData.map(item => item.nombreProducto);
        const valores = filteredData.map(item => item.cantidadSobrante);

        const canvas = document.getElementById('graficoSobrantes') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartMasSobrantes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Unidades sobrantes',
                    data: valores,
                    backgroundColor: 'rgba(75, 192, 75, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }

    private generarGraficoDineroCombinado(): void {
        if (this.chartDineroCombinado) {
            this.chartDineroCombinado.destroy();
        }

        const mesesNombre = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labels = mesesNombre;

        const datosFaltantePorMes = new Array<number>(12).fill(0);
        this.dineroFaltanteMes.forEach(item => {
            const idx = item.mes - 1;
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

    private generarGraficoCategoriasFaltantes(): void {
        if (this.chartCategoriasFaltantes) {
            this.chartCategoriasFaltantes.destroy();
        }
        const filteredData = this.filterAndLimitData(this.categoriasFaltantes);
        const labels = filteredData.map(item => item.nombreCategoria);
        const valores = filteredData.map(item => item.cantidadFaltante);

        const canvas = document.getElementById('graficoCategoriasFaltantes') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartCategoriasFaltantes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Unidades faltantes (categoría)',
                    data: valores,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }

    private generarGraficoCategoriasSobrantes(): void {
        if (this.chartCategoriasSobrantes) {
            this.chartCategoriasSobrantes.destroy();
        }
        const filteredData = this.filterAndLimitData(this.categoriasSobrantes);
        const labels = filteredData.map(item => item.nombreCategoria);
        const valores = filteredData.map(item => item.cantidadSobrante);

        const canvas = document.getElementById('graficoCategoriasSobrantes') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartCategoriasSobrantes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Unidades sobrantes (categoría)',
                    data: valores,
                    backgroundColor: 'rgba(75, 192, 75, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }
}