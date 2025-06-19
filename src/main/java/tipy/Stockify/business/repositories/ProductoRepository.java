package tipy.Stockify.business.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tipy.Stockify.business.entities.Producto;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrue();

    Optional<Producto> findByIdAndActivoTrue(Long id);

    List<Producto> findBySucursalIdAndActivoTrue(Long sucursalId);

    @Query("SELECT p FROM Producto p JOIN p.codigosBarra cb WHERE cb.codigo = :codigoBarra")
    Optional<Producto> findByCodigoBarra(String codigoBarra);
}