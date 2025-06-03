// src/app/models/estadistica.model.ts

/**
 * 1) Productos más vendidos
 * - productoId: Identificador numérico del producto
 * - nombreProducto: Nombre descriptivo del producto
 * - cantidadVendida: Cantidad total vendida en el rango de fechas
 */
export interface EstadisticaProductoVendidos {
    productoId: number;
    nombreProducto: string;
    cantidadVendida: number;
}

/**
 * 2) Productos con mayor faltante
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
 * 3) (Opcional) Productos menos vendidos
 * - productoId: Identificador del producto
 * - nombreProducto: Nombre descriptivo del producto
 * - cantidadVendida: Cantidad total vendida (esta vez, los que menor venta tuvieron)
 */
export interface EstadisticaProductoMenosVendidos {
    productoId: number;
    nombreProducto: string;
    cantidadVendida: number;
}

export interface EstadisticaDineroFaltante {
    fecha: string;          // p.ej. "2025-05-20"
    totalFaltante: number;
}

export interface EstadisticaDineroFaltanteMes {
    mes: number;           // 1 = enero, 2 = febrero, etc.
    totalFaltante: number; // monto sumado en ese mes
}

export interface EstadisticaDineroSobranteMes {
    mes: number;
    totalSobrante: number;
}

export interface EstadisticaCategoriaVendida {
    categoriaId: number;
    nombreCategoria: string;
    cantidadVendida: number;
}
