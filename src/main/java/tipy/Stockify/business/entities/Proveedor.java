package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

@Entity
@Data
@Table(name = "PROVEEDOR")
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "proveedor_id_seq", sequenceName = "proveedor_seq", allocationSize = 1)
    @Column(name = "ID_PROVEEDOR")
    private long id;

    @Column(name = "RUT")
    private String rut;

    @Column(name = "NOMBRE_PROVEEDOR")
    private String nombre;

    @Column(name = "DIRECCION_PROVEEDOR")
    private String direccion;

    @Column(name = "TELEFONO_PROVEEDOR")
    private String telefono;

    @Column(name = "NOMBRE_VENDEDOR")
    private String nombreVendedor;

}
