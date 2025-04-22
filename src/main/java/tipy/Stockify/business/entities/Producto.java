package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.util.List;

@Entity
@Data
@Table(name = "PRODUCTO")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CODIGO_BARRA")
    private String codigoBarra;

    @Column(name = "IMAGEN")
    private String imagen;

    @Column(name = "NOMBRE")
    private String nombre;

    @Column(name = "DETALLE")
    private String detalle;

    @Column(name = "PRECIO")
    private float precio;

    @Column(name = "CANTIDAD_STOCK")
    private Long cantidadStock;

    @ManyToOne
    @JoinColumn(name = "SUCURSAL_ID")
    private Sucursal sucursal;

    @ManyToOne
    @JoinColumn(name = "CATEGORIA_ID")
    private Categoria categoria;

    @ManyToMany(mappedBy = "productos")
    private List<Conteo> conteos;

    @ManyToMany
    @JoinTable(
            name = "PRODUCTO_LOTE",
            joinColumns = @JoinColumn(name = "PRODUCTO_ID"),
            inverseJoinColumns = @JoinColumn(name = "LOTE_ID")
    )
    private List<Lote> lotes;

    @ManyToMany
    @JoinTable(
            name = "PRODUCTO_PROVEEDOR",
            joinColumns = @JoinColumn(name = "PRODUCTO_ID"),
            inverseJoinColumns = @JoinColumn(name = "PROVEEDOR_ID")
    )
    private List<Proveedor> proveedores;
}
