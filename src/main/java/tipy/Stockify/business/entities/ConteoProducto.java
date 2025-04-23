package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "CONTEO_PRODUCTOS")
public class ConteoProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "PRECIO_ACTUAL")
    private float precioActual;

    @Column(name = "CANTIDAD_ESPERADA")
    private Integer cantidadEsperada;

    @Column(name = "CANTIDAD_CONTADA")
    private Integer cantidadContada;

    @ManyToOne
    @JoinColumn(name = "CONTEO_ID")
    private Conteo conteo;

    @ManyToOne
    @JoinColumn(name = "PRODUCTO_ID")
    private Producto producto;

    @Column(name = "ACTIVO", nullable = false)
    private boolean activo = true;
}