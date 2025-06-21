package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Categoria;
import tipy.Stockify.business.entities.Sucursal;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    /**
     * Encuentra todas las categorías con activo = true.
     *
     * @return Lista de categorías activas.
     */
    List<Categoria> findByActivoTrue();

    /**
     * Encuentra una categoría por su ID, solo si activo = true.
     *
     * @param id ID de la categoría.
     * @return Optional con la categoría activa, o vacío si no existe o está inactiva.
     */
    Optional<Categoria> findByIdAndActivoTrue(Long id);

    Optional<Categoria> findByNombreIgnoreCase(String nombre);

    Optional<Categoria> findByNombreIgnoreCaseAndSucursal(String nombre, Sucursal sucursal);
}