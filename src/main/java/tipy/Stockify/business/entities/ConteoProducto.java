package tipy.Stockify.business.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "CONTEO_PRODUCTO")
public class ConteoProducto {

    @Id
    @Column(name = "ID_CONTEO_PRODUCTO")
    private long id;

    @Column(name = "PRECIO_ACTUAL")
    private Float precioActual;

    @Column(name = "CANTIDAD_ESPERADA")
    private Long cantidadEsperada;

    @Column(name = "CANTIDAD_CONTADA")
    private Long cantidadContada;

}
