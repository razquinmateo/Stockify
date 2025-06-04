package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tipy.Stockify.business.entities.ConteoUsuario;

import java.util.List;
import java.util.Optional;

public interface ConteoUsuarioRepository extends JpaRepository<ConteoUsuario, Long> {

    List<ConteoUsuario> findByConteoId(Long conteoId);

    boolean existsByConteoIdAndUsuarioId(Long conteoId, Long usuarioId);
}