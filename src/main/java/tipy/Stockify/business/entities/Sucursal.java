package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.util.List;

@Entity
@Data
@Table(name = "SUCURSAL")
public class Sucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOMBRE")
    private String nombre;

    @Column(name = "DIRECCION")
    private String direccion;

    @Column(name = "TELEFONO")
    private String telefono;

    @ManyToOne
    @JoinColumn(name = "EMPRESA_ID")
    private Empresa empresa;

    @OneToMany(mappedBy = "sucursal")
    private List<Usuario> usuarios;

    @OneToMany(mappedBy = "sucursal")
    private List<Producto> productos;

    @OneToMany(mappedBy = "sucursal")
    private List<Categoria> categorias;
}
