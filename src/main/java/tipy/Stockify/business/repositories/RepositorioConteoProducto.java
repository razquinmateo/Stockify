package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tipy.Stockify.business.entities.ConteoProducto;

import java.time.LocalDateTime;
import java.util.List;

public interface RepositorioConteoProducto extends JpaRepository<ConteoProducto, Integer> {

    @Query("SELECT cp FROM ConteoProducto cp " +
            "JOIN cp.conteo c " +
            "JOIN cp.producto p " +
            "WHERE c.activo = false " +
            "AND c.fechaHora BETWEEN :desde AND :hasta " +
            "AND p.sucursal.id = :sucursalId")
    List<ConteoProducto> findByConteoFinalizadoAndFechaHoraBetweenAndSucursal(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("sucursalId") Long sucursalId);

    @Query("SELECT cp FROM ConteoProducto cp " +
            "JOIN cp.conteo c " +
            "JOIN cp.producto p " +
            "WHERE c.activo = false " +
            "AND EXTRACT(YEAR FROM c.fechaHora) = :anio " +
            "AND p.sucursal.id = :sucursalId")
    List<ConteoProducto> findByConteoFinalizadoAndYearAndSucursal(
            @Param("anio") Integer anio,
            @Param("sucursalId") Long sucursalId);
}