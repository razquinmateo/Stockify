package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Conteo;

public interface ConteoRepository extends JpaRepository<Conteo, Long> {
}
