package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "CONTEO")
public class Conteo {

    public enum TipoConteo {
        LIBRE,
        CATEGORIAS
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "FECHA_HORA")
    private LocalDateTime fechaHora;

    @Column(name = "CONTEO_FINALIZADO")
    private boolean conteoFinalizado;

    @ManyToOne
    @JoinColumn(name = "USUARIO_ID")
    private Usuario usuario;

    @ManyToMany(mappedBy = "conteos")
    private List<Reporte> reportes;

    @OneToMany(mappedBy = "conteo")
    private List<ConteoUsuario> participantes;

    @ManyToMany
    @JoinTable(
            name = "CONTEO_PRODUCTOS",
            joinColumns = @JoinColumn(name = "CONTEO_ID"),
            inverseJoinColumns = @JoinColumn(name = "PRODUCTO_ID")
    )
    private List<Producto> productos;

    @Column(name = "ACTIVO", nullable = false)
    private boolean activo = true;

    @Column(name = "TIPO_CONTEO", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoConteo tipoConteo = TipoConteo.LIBRE;
}