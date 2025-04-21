package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

@Entity
@Data
@Table(name = "PRODUCTO")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "producto_id_seq", sequenceName = "producto_seq", allocationSize = 1)
    @Column(name = "ID_PRODUCTO")
    private long id;

    @Column(name = "CODIGO_PRODUCTO")
    private String codigoBarra;

    @Column(name = "IMAGEN_PRODUCTO")
    private String imagen;

    @Column(name = "NOMBRE_PRODUCTO")
    private String nombre;

    @Column(name = "DETALLE_PRODUCTO")
    private String detalle;

    @Column(name = "PRECIO_PRODUCTO")
    private Float precio;

    @Column(name = "STOCK_PRODUCTO")
    private long cantidadStock;

}
