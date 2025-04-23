package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Reporte;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    /**
     * Encuentra todos los reportes con activo = true.
     *
     * @return Lista de reportes activos.
     */
    List<Reporte> findByActivoTrue();

    /**
     * Encuentra un reporte por su ID, solo si activo = true.
     *
     * @param id ID del reporte.
     * @return Optional con el reporte activo, o vacío si no existe o está inactivo.
     */
    Optional<Reporte> findByIdAndActivoTrue(Long id);
}