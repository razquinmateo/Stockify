package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.ConteoProducto;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConteoProductoRepository extends JpaRepository<ConteoProducto, Integer> {

    /**
     * Encuentra todos los conteos de producto con activo = true.
     *
     * @return Lista de conteos de producto activos.
     */
    List<ConteoProducto> findByActivoTrue();

    /**
     * Encuentra un conteo de producto por su ID, solo si activo = true.
     *
     * @param id ID del conteo de producto.
     * @return Optional con el conteo de producto activo, o vacío si no existe o está inactivo.
     */
    Optional<ConteoProducto> findByIdAndActivoTrue(Integer id);

    List<ConteoProducto> findByConteoId(Long conteoId);
}