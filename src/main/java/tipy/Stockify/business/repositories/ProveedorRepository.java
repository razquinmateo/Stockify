package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Proveedor;

public interface ProveedorRepository extends JpaRepository<Proveedor,Long> {
}
