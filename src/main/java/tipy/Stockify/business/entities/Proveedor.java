package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PROVEEDOR")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "RUT", nullable = false, unique = true)
    private String rut;

    @Column(name = "NOMBRE", nullable = false)
    private String nombre;

    @Column(name = "DIRECCION")
    private String direccion;

    @Column(name = "TELEFONO")
    private String telefono;

    @Column(name = "NOMBRE_VENDEDOR")
    private String nombreVendedor;

    @Column(name = "ACTIVO", nullable = false)
    private Boolean activo = true;

    @ManyToMany(mappedBy = "proveedores")
    private List<Producto> productos = new ArrayList<>();
}