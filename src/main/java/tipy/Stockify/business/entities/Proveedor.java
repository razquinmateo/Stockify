package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.util.List;

@Entity
@Data
@Table(name = "PROVEEDOR")
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "RUT")
    private String rut;

    @Column(name = "NOMBRE")
    private String nombre;

    @Column(name = "DIRECCION")
    private String direccion;

    @Column(name = "TELEFONO")
    private String telefono;

    @Column(name = "NOMBRE_VENDEDOR")
    private String nombreVendedor;

    @ManyToMany(mappedBy = "proveedores")
    private List<Producto> productos;
}
