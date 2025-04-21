package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

@Entity
@Data
@Table(name = "SUCURSAL")
public class Sucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "sucursal_id_seq", sequenceName = "sucursal_seq", allocationSize = 1)
    @Column(name = "ID_SUCURSAL")
    private long id;

    @Column(name = "NOMBRE_SUCURSAL")
    private String nombre;

    @Column(name = "DIRECCION")
    private String direccion;

    @Column(name = "TELEFONO_SUCURSAL")
    private String telefono;

}
