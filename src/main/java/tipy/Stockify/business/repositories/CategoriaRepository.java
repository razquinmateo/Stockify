package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria,Long> {
}
