package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Usuario;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Encuentra todos los usuarios con activo = true.
     *
     * @return Lista de usuarios activos.
     */
    List<Usuario> findByActivoTrue();

    /**
     * Encuentra un usuario por su ID, solo si activo = true.
     *
     * @param id ID del usuario.
     * @return Optional con el usuario activo, o vacío si no existe o está inactivo.
     */
    Optional<Usuario> findByIdAndActivoTrue(Long id);
}
