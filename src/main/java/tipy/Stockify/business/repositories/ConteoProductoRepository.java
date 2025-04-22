package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.ConteoProducto;

public interface ConteoProductoRepository extends JpaRepository<ConteoProducto, Integer> {
}
