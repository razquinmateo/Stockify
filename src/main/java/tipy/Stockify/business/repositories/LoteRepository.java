package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Lote;

public interface LoteRepository extends JpaRepository<Lote, Long> {
}
