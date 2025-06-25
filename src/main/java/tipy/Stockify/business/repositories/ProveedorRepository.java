package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Proveedor;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    /**
     * Encuentra todos los proveedores con activo = true.
     *
     * @return Lista de proveedores activos.
     */
    List<Proveedor> findByActivoTrue();

    /**
     * Encuentra un proveedor por su ID, solo si activo = true.
     *
     * @param id ID del proveedor.
     * @return Optional con el proveedor activo, o vacío si no existe o está inactivo.
     */
    Optional<Proveedor> findByIdAndActivoTrue(Long id);

    /**
     * Encuentra proveedores activos asociados a productos de una sucursal específica.
     *
     * @param sucursalId ID de la sucursal.
     * @return Lista de proveedores activos.
     */
    @Query("SELECT DISTINCT prov FROM Proveedor prov " +
            "JOIN prov.productos prod " +
            "WHERE prod.sucursal.id = :sucursalId AND prov.activo = true")
    List<Proveedor> findByProductosSucursalIdAndActivoTrue(Long sucursalId);

    /**
     * Encuentra proveedores asociados a productos de una sucursal específica.
     *
     * @param sucursalId ID de la sucursal.
     * @return Lista de proveedores.
     */
    @Query("SELECT DISTINCT prov FROM Proveedor prov " +
            "JOIN prov.productos prod " +
            "WHERE prod.sucursal.id = :sucursalId")
    List<Proveedor> findByProductosSucursalId(Long sucursalId);

    /**
     * Encuentra un proveedor por su nombre (case-insensitive), solo si activo = true.
     *
     * @param nombre Nombre del proveedor.
     * @return Optional con el proveedor activo, o vacío si no existe o está inactivo.
     */
    Optional<Proveedor> findByNombreIgnoreCaseAndActivoTrue(String nombre);
}