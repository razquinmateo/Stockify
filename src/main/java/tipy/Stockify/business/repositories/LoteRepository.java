package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Lote;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {

    /**
     * Encuentra todos los lotes con activo = true.
     *
     * @return Lista de lotes activos.
     */
    List<Lote> findByActivoTrue();

    /**
     * Encuentra un lote por su ID, solo si activo = true.
     *
     * @param id ID del lote.
     * @return Optional con el lote activo, o vacío si no existe o está inactivo.
     */
    Optional<Lote> findByIdAndActivoTrue(Long id);
}