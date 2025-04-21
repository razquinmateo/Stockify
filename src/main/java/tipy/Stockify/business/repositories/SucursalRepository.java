package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Sucursal;

public interface SucursalRepository extends JpaRepository<Sucursal,Long> {
}
