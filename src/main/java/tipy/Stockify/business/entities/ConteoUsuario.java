package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(
        name = "CONTEO_USUARIO",
        uniqueConstraints = @UniqueConstraint(columnNames = {"CONTEO_ID", "USUARIO_ID"})
)
public class ConteoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "USUARIO_ID", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "CONTEO_ID", nullable = false)
    private Conteo conteo;
}