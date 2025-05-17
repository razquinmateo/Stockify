package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.SucursalProveedor;

import java.util.List;

@Repository
public interface SucursalProveedorRepository extends JpaRepository<SucursalProveedor, Long> {

    /**
     * Encuentra todas las relaciones Sucursal-Proveedor para una sucursal específica
     * donde el proveedor está activo.
     *
     * @param sucursalId ID de la sucursal.
     * @return Lista de relaciones Sucursal-Proveedor.
     */
    @Query("SELECT sp FROM SucursalProveedor sp " +
            "WHERE sp.sucursal.id = :sucursalId AND sp.proveedor.activo = true")
    List<SucursalProveedor> findBySucursalIdAndProveedorActivoTrue(Long sucursalId);

    /**
     * Verifica si existe una relación Sucursal-Proveedor para una sucursal y proveedor específicos.
     *
     * @param sucursalId ID de la sucursal.
     * @param proveedorId ID del proveedor.
     * @return true si la relación existe, false en caso contrario.
     */
    boolean existsBySucursalIdAndProveedorId(Long sucursalId, Long proveedorId);
}