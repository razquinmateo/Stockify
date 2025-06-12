// src/app/estadisticas/estadisticas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { EstadisticasService } from '../../services/estadisticas.service';
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

        const sucursalIdSeguro = this.sucursalId; // variable local no nula

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
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const primaryColor: [number, number, number] = [43, 74, 123];
            const secondaryColor: [number, number, number] = [224, 231, 255];
            const textColor: [number, number, number] = [51, 51, 51];
            const whiteColor: [number, number, number] = [255, 255, 255];

            const addFooter = (pageNum: number) => {
                doc.setFontSize(10);
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.setFont('helvetica', 'normal');
                doc.text(`Stockify - Reporte de Inventario | Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.text(`Generado el ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
            };

            doc.setFont('helvetica', 'normal');
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setFontSize(22);
            doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('Reporte de Inventario - Stockify', pageWidth / 2, 20, { align: 'center' });

            let yPosition = 40;
            doc.setFontSize(12);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generado por: ${this.nombreUsuarioLogueado}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Sucursal ID: ${this.sucursalId || 'No disponible'}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Período: ${this.fechaDesde} a ${this.fechaHasta}`, margin, yPosition);
            yPosition += 10;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumen General', margin, yPosition);
            yPosition += 5;
            doc.setLineWidth(0.5);
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            const totalFaltantes = this.masFaltaron.reduce((sum, item) => sum + item.cantidadFaltante, 0);
            const totalSobrantes = this.masSobrantes.reduce((sum, item) => sum + item.cantidadSobrante, 0);
            const totalDineroFaltante = this.dineroFaltanteMes.reduce((sum, item) => sum + item.totalFaltante, 0);
            const totalDineroSobrante = this.dineroSobranteMes.reduce((sum, item) => sum + item.totalSobrante, 0);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F');
            doc.text(`Total Productos Faltantes: ${totalFaltantes}`, margin + 5, yPosition + 8);
            doc.text(`Total Productos Sobrantes: ${totalSobrantes}`, margin + 5, yPosition + 16);
            doc.text(`Dinero Faltante Total: $${totalDineroFaltante.toFixed(2)}`, margin + 5, yPosition + 24);
            doc.text(`Dinero Sobrante Total: $${totalDineroSobrante.toFixed(2)}`, pageWidth / 2, yPosition + 24);
            yPosition += 40;

            let pageCount = 1;
            addFooter(pageCount);

            const checkPage = () => {
                if (yPosition > pageHeight - 50) {
                    doc.addPage();
                    pageCount++;
                    yPosition = 20;
                    addFooter(pageCount);
                }
            };

            if (this.masFaltaron.length > 0) {
                checkPage();
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Productos con Mayor Faltante', margin, yPosition);
                yPosition += 5;
                doc.setLineWidth(0.5);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['ID', 'Producto', 'Cantidad Faltante']],
                    body: this.masFaltaron.map(item => [item.productoId, item.nombreProducto, item.cantidadFaltante]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: whiteColor,
                        fontSize: 11,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        textColor: textColor,
                        fontSize: 10,
                        cellPadding: 4
                    },
                    alternateRowStyles: {
                        fillColor: secondaryColor
                    },
                    margin: { left: margin, right: margin },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.masSobrantes.length > 0) {
                checkPage();
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Productos con Mayor Sobrante', margin, yPosition);
                yPosition += 5;
                doc.setLineWidth(0.5);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['ID', 'Producto', 'Cantidad Sobrante']],
                    body: this.masSobrantes.map(item => [item.productoId, item.nombreProducto, item.cantidadSobrante]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: whiteColor,
                        fontSize: 11,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        textColor: textColor,
                        fontSize: 10,
                        cellPadding: 4
                    },
                    alternateRowStyles: {
                        fillColor: secondaryColor
                    },
                    margin: { left: margin, right: margin },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.categoriasFaltantes.length > 0) {
                checkPage();
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Categorías con Mayor Faltante', margin, yPosition);
                yPosition += 5;
                doc.setLineWidth(0.5);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['ID', 'Categoría', 'Cantidad Faltante']],
                    body: this.categoriasFaltantes.map(item => [item.categoriaId, item.nombreCategoria, item.cantidadFaltante]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: whiteColor,
                        fontSize: 11,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        textColor: textColor,
                        fontSize: 10,
                        cellPadding: 4
                    },
                    alternateRowStyles: {
                        fillColor: secondaryColor
                    },
                    margin: { left: margin, right: margin },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.categoriasSobrantes.length > 0) {
                checkPage();
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Categorías con Mayor Sobrante', margin, yPosition);
                yPosition += 5;
                doc.setLineWidth(0.5);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['ID', 'Categoría', 'Cantidad Sobrante']],
                    body: this.categoriasSobrantes.map(item => [item.categoriaId, item.nombreCategoria, item.cantidadSobrante]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: whiteColor,
                        fontSize: 11,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        textColor: textColor,
                        fontSize: 10,
                        cellPadding: 4
                    },
                    alternateRowStyles: {
                        fillColor: secondaryColor
                    },
                    margin: { left: margin, right: margin },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'right' }
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            if (this.dineroFaltanteMes.length > 0 || this.dineroSobranteMes.length > 0) {
                checkPage();
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(`Dinero Faltante y Sobrante por Mes (${this.anioActual})`, margin, yPosition);
                yPosition += 5;
                doc.setLineWidth(0.5);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;

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
                        fillColor: primaryColor,
                        textColor: whiteColor,
                        fontSize: 11,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        textColor: textColor,
                        fontSize: 10,
                        cellPadding: 4
                    },
                    alternateRowStyles: {
                        fillColor: secondaryColor
                    },
                    margin: { left: margin, right: margin },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 50, halign: 'right' },
                        2: { cellWidth: 50, halign: 'right' }
                    }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 15;
            }

            doc.save(`Stockify_Report_Sucursal${this.sucursalId}_${this.fechaDesde}_${this.fechaHasta}.pdf`);
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.errorMsg = 'Error al generar el reporte PDF';
        } finally {
            this.loading = false;
        }
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