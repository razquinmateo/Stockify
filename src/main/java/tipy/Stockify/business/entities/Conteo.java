package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Entity
@Data
@Table(name = "CONTEO")
public class Conteo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "FECHA_HORA")
    private LocalDate fechaHora;

    @Column(name = "CONTEO_FINALIZADO")
    private boolean conteoFinalizado;

    @ManyToOne
    @JoinColumn(name = "USUARIO_ID")
    private Usuario usuario;

    @ManyToMany(mappedBy = "conteos")
    private List<Reporte> reportes;

    @ManyToMany
    @JoinTable(
            name = "CONTEO_PRODUCTOS",
            joinColumns = @JoinColumn(name = "CONTEO_ID"),
            inverseJoinColumns = @JoinColumn(name = "PRODUCTO_ID")
    )
    private List<Producto> productos;
}
