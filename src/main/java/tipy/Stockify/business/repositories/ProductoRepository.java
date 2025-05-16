package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Producto;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    /**
     * Encuentra todos los productos con activo = true.
     *
     * @return Lista de productos activos.
     */
    List<Producto> findByActivoTrue();

    /**
     * Encuentra un producto por su ID, solo si activo = true.
     *
     * @param id ID del producto.
     * @return Optional con el producto activo, o vacío si no existe o está inactivo.
     */
    Optional<Producto> findByIdAndActivoTrue(Long id);
    List<Producto> findBySucursalIdAndActivoTrue(Long sucursalId);
}