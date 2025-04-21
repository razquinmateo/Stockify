package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "CATEGORIA")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "categoria_id_seq", sequenceName = "categoria_seq", allocationSize = 1)
    @Column(name = "ID_CATEGORIA")
    private long id;

    @Column(name = "NOMBRE_CATEGORIA")
    private String nombre;

    @Column(name = "DESCRIPCION_CATEGORIA")
    private String descripcion;

}
