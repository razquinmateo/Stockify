package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Sucursal;

import java.util.List;
import java.util.Optional;

@Repository
public interface SucursalRepository extends JpaRepository<Sucursal, Long> {

    /**
     * Encuentra todas las sucursales con activo = true.
     *
     * @return Lista de sucursales activas.
     */
    List<Sucursal> findByActivoTrue();

    /**
     * Encuentra una sucursal por su ID, solo si activo = true.
     *
     * @param id ID de la sucursal.
     * @return Optional con la sucursal activa, o vacío si no existe o está inactiva.
     */
    Optional<Sucursal> findByIdAndActivoTrue(Long id);

    Optional<Sucursal> findByNombreIgnoreCase(String nombre);
}