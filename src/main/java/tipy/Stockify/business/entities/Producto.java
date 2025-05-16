package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PRODUCTO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CODIGO_BARRA", nullable = false, unique = true)
    private String codigoBarra;

    @Column(name = "IMAGEN", columnDefinition = "TEXT")
    private String imagen;

    @Column(name = "NOMBRE", nullable = false)
    private String nombre;

    @Column(name = "DETALLE")
    private String detalle;

    @Column(name = "PRECIO", nullable = false)
    private Float precio;

    @Column(name = "CANTIDAD_STOCK", nullable = false)
    private Long cantidadStock;

    @Column(name = "ACTIVO", nullable = false)
    private Boolean activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUCURSAL_ID", nullable = false)
    private Sucursal sucursal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CATEGORIA_ID", nullable = false)
    private Categoria categoria;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Lote> lotes = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "PRODUCTO_PROVEEDOR",
            joinColumns = @JoinColumn(name = "producto_id"),
            inverseJoinColumns = @JoinColumn(name = "proveedor_id")
    )
    private List<Proveedor> proveedores = new ArrayList<>();

    public void addLote(Lote lote) {
        lotes.add(lote);
        lote.setProducto(this);
    }

    public void removeLote(Lote lote) {
        lotes.remove(lote);
        lote.setProducto(null);
    }

    public void addProveedor(Proveedor proveedor) {
        proveedores.add(proveedor);
    }

    public void removeProveedor(Proveedor proveedor) {
        proveedores.remove(proveedor);
    }
}