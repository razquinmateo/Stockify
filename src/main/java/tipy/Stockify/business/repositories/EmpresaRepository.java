package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Empresa;

public interface EmpresaRepository extends JpaRepository<Empresa,Long> {
}
