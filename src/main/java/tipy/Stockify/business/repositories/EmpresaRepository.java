package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Empresa;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    /**
     * Encuentra todas las empresas con activo = true.
     *
     * @return Lista de empresas activas.
     */
    List<Empresa> findByActivoTrue();

    /**
     * Encuentra una empresa por su ID, solo si activo = true.
     *
     * @param id ID de la empresa.
     * @return Optional con la empresa activa, o vacío si no existe o está inactiva.
     */
    Optional<Empresa> findByIdAndActivoTrue(Long id);

    Optional<Empresa> findByNombreIgnoreCase(String nombre);
}