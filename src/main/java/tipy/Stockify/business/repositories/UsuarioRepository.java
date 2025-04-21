package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario,Long> {

}
