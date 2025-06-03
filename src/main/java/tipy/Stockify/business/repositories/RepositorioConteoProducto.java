package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tipy.Stockify.business.entities.ConteoProducto;
import tipy.Stockify.dtos.*;

import java.time.LocalDateTime;  // <-- cambiamos a LocalDateTime
import java.util.List;

public interface RepositorioConteoProducto extends JpaRepository<ConteoProducto, Long> {

    /**
     * 1) Productos más vendidos:
     *    Ahora recibe LocalDateTime desde/hasta para comparar c.fechaHora.
     */
    @Query("SELECT new tipy.Stockify.dtos.ProductoVendidosDto(" +
            " cp.producto.id, p.nombre, SUM(cp.cantidadContada) ) " +
            "FROM ConteoProducto cp " +
            "JOIN cp.conteo c " +
            "JOIN cp.producto p " +
            "WHERE c.conteoFinalizado = true " +
            "  AND c.fechaHora BETWEEN :desde AND :hasta " +
            "GROUP BY cp.producto.id, p.nombre " +
            "ORDER BY SUM(cp.cantidadContada) DESC")
    List<ProductoVendidosDto> obtenerProductosMasVendidos(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    /**
     * 2) Productos con mayor faltante:
     */
    @Query("SELECT new tipy.Stockify.dtos.ProductoFaltanteDto(" +
            " cp.producto.id, p.nombre, SUM(cp.cantidadEsperada - cp.cantidadContada) ) " +
            "FROM ConteoProducto cp " +
            "JOIN cp.conteo c " +
            "JOIN cp.producto p " +
            "WHERE c.conteoFinalizado = true " +
            "  AND c.fechaHora BETWEEN :desde AND :hasta " +
            "  AND (cp.cantidadEsperada - cp.cantidadContada) > 0 " +
            "GROUP BY cp.producto.id, p.nombre " +
            "ORDER BY SUM(cp.cantidadEsperada - cp.cantidadContada) DESC")
    List<ProductoFaltanteDto> obtenerProductosConMayorFaltante(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    /**
     * 3) Productos menos vendidos:
     */
    @Query("SELECT new tipy.Stockify.dtos.ProductoMenosVendidosDto(" +
            " cp.producto.id, p.nombre, SUM(cp.cantidadContada) ) " +
            "FROM ConteoProducto cp " +
            "JOIN cp.conteo c " +
            "JOIN cp.producto p " +
            "WHERE c.conteoFinalizado = true " +
            "  AND c.fechaHora BETWEEN :desde AND :hasta " +
            "GROUP BY cp.producto.id, p.nombre " +
            "ORDER BY SUM(cp.cantidadContada) ASC")
    List<ProductoMenosVendidosDto> obtenerProductosMenosVendidos(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    @Query("SELECT new tipy.Stockify.dtos.DineroFaltanteMesDto(" +
            " EXTRACT(MONTH FROM c.fechaHora), " +
            " SUM((cp.cantidadEsperada - cp.cantidadContada) * cp.precioActual) ) " +
            "FROM ConteoProducto cp " +
            "JOIN cp.conteo c " +
            "WHERE c.conteoFinalizado = true " +
            "  AND EXTRACT(YEAR FROM c.fechaHora) = :anio " +
            "  AND (cp.cantidadEsperada - cp.cantidadContada) > 0 " +
            "GROUP BY EXTRACT(MONTH FROM c.fechaHora) " +
            "ORDER BY EXTRACT(MONTH FROM c.fechaHora) ASC")
    List<DineroFaltanteMesDto> obtenerDineroFaltantePorMes(
            @Param("anio") Integer anio);

    @Query("SELECT new tipy.Stockify.dtos.CategoriaVendidaDto(" +
            "  cat.id, cat.nombre, SUM(cp.cantidadContada) ) " +
            "FROM ConteoProducto cp " +
            "  JOIN cp.conteo c " +
            "  JOIN cp.producto p " +
            "  JOIN p.categoria cat " +
            "WHERE c.conteoFinalizado = true " +
            "  AND c.fechaHora BETWEEN :desde AND :hasta " +
            "GROUP BY cat.id, cat.nombre " +
            "ORDER BY SUM(cp.cantidadContada) DESC")
    List<CategoriaVendidaDto> obtenerCategoriasMasVendidas(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    @Query(
            "SELECT new tipy.Stockify.dtos.DineroSobranteMesDto( " +
                    "  EXTRACT(MONTH FROM c.fechaHora), " +
                    "  SUM((cp.cantidadContada - cp.cantidadEsperada) * cp.precioActual) " +
                    ") " +
                    "FROM ConteoProducto cp " +
                    "JOIN cp.conteo c " +
                    "WHERE c.conteoFinalizado = true " +
                    "  AND EXTRACT(YEAR FROM c.fechaHora) = :anio " +
                    "  AND (cp.cantidadContada - cp.cantidadEsperada) > 0 " +
                    "GROUP BY EXTRACT(MONTH FROM c.fechaHora) " +
                    "ORDER BY EXTRACT(MONTH FROM c.fechaHora) ASC"
    )
    List<DineroSobranteMesDto> obtenerDineroSobrantePorMes(
            @Param("anio") Integer anio
    );


}
