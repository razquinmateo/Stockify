package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Conteo;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConteoRepository extends JpaRepository<Conteo, Long> {

    /**
     * Encuentra todos los conteos con activo = true.
     *
     * @return Lista de conteos activos.
     */
    List<Conteo> findByActivoTrue();

    /**
     * Encuentra un conteo por su ID, solo si activo = true.
     *
     * @param id ID del conteo.
     * @return Optional con el conteo activo, o vacío si no existe o está inactivo.
     */
    Optional<Conteo> findByIdAndActivoTrue(Long id);


}