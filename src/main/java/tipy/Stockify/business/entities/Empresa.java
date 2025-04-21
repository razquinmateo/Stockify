package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

@Entity
@Data
@Table(name = "EMPRESA")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "empresa_id_seq", sequenceName = "empresa_seq", allocationSize = 1)
    @Column(name = "ID_EMPRESA")
    private long id;

    @Column(name = "NOMBRE_EMPRESA")
    private String nombre;

    @Column(name = "RUT")
    private String rut;

    @Column(name = "DIRECCION_EMPRESA")
    private String direccion;

    @Column(name = "TELEFONO_EMPRESA")
    private String telefono;

}
