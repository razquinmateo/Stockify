// src/app/models/estadistica.model.ts

/**
 * 1) Productos con mayor faltante
 * - productoId: Identificador del producto
 * - nombreProducto: Nombre descriptivo del producto
 * - cantidadFaltante: Total de unidades faltantes (cantidadEsperada - cantidadContada)
 */
export interface EstadisticaProductoFaltante {
    productoId: number;
    nombreProducto: string;
    cantidadFaltante: number;
}

/**
 * 2) Productos con mayor sobrante
 * - productoId: Identificador del producto
 * - nombreProducto: Nombre descriptivo del producto
 * - cantidadSobrante: Total de unidades sobrantes (cantidadContada - cantidadEsperada)
 */
export interface EstadisticaProductoSobrante {
    productoId: number;
    nombreProducto: string;
    cantidadSobrante: number;
}

/**
 * 3) Dinero faltante por mes
 * - mes: 1 = enero, 2 = febrero, etc.
 * - totalFaltante: Monto sumado en ese mes
 */
export interface EstadisticaDineroFaltanteMes {
    mes: number;
    totalFaltante: number;
}

/**
 * 4) Dinero sobrante por mes
 * - mes: 1 = enero, 2 = febrero, etc.
 * - totalSobrante: Monto sumado en ese mes
 */
export interface EstadisticaDineroSobranteMes {
    mes: number;
    totalSobrante: number;
}

/**
 * 5) Categorías con mayor faltante
 * - categoriaId: Identificador de la categoría
 * - nombreCategoria: Nombre descriptivo de la categoría
 * - cantidadFaltante: Total de unidades faltantes en la categoría
 */
export interface EstadisticaCategoriaFaltante {
    categoriaId: number;
    nombreCategoria: string;
    cantidadFaltante: number;
}

/**
 * 6) Categorías con mayor sobrante
 * - categoriaId: Identificador de la categoría
 * - nombreCategoria: Nombre descriptivo de la categoría
 * - cantidadSobrante: Total de unidades sobrantes en la categoría
 */
export interface EstadisticaCategoriaSobrante {
    categoriaId: number;
    nombreCategoria: string;
    cantidadSobrante: number;
}