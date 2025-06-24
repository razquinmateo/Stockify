package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.DynamicInsert;

import java.util.List;

@Entity
@DynamicInsert(false)
@Data
@Table(name = "CATEGORIA")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "id_categoria", nullable = true)
    private String idCategoria;

    @Column(name = "NOMBRE")
    private String nombre;

    @Column(name = "DESCRIPCION")
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "SUCURSAL_ID")
    private Sucursal sucursal;

    @OneToMany(mappedBy = "categoria")
    private List<Producto> productos;

    @Column(name = "ACTIVO", nullable = false)
    private boolean activo = true;
}