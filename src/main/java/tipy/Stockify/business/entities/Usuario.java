package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.util.List;

@Entity
@Data
@Table(name = "USUARIO")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOMBRE")
    private String nombre;

    @Column(name = "APELLIDO")
    private String apellido;

    @Column(name = "NOMBRE_USUARIO")
    private String nombreUsuario;

    @Column(name = "CONTRASENIA")
    private String contrasenia;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROL")
    private RolUsuario rol;

    @ManyToOne
    @JoinColumn(name = "SUCURSAL_ID")
    private Sucursal sucursal;

    @OneToMany(mappedBy = "usuario")
    private List<Conteo> conteos;

    @OneToMany(mappedBy = "usuario")
    private List<ConteoUsuario> conteoParticipaciones;

    @Column(name = "ACTIVO", nullable = false)
    private boolean activo = true;
}