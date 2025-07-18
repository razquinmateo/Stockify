package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "CATEGORIA")
@Data
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOMBRE")
    private String nombre;

    @Column(name = "DESCRIPCION")
    private String descripcion;

    @Column(name = "CODIGO_CATEGORIA")
    private String codigoCategoria;

    @ManyToOne
    @JoinColumn(name = "SUCURSAL_ID")
    private Sucursal sucursal;

    @OneToMany(mappedBy = "categoria")
    private List<Producto> productos;

    @Column(name = "ACTIVO", nullable = false)
    private boolean activo = true;
}