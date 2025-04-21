package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Producto;

public interface ProductoRepository extends JpaRepository<Producto,Long> {
}
