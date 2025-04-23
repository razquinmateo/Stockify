package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Entity
@Data
@Table(name = "REPORTE")
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "FECHA_GENERACION")
    private LocalDate fechaGeneracion;

    @Column(name = "TOTAL_FALTANTE")
    private float totalFaltante;

    @Column(name = "TOTAL_SOBRANTE")
    private float totalSobrante;

    @Column(name = "DIFERENCIA_MONETARIA")
    private float diferenciaMonetaria;

    @ManyToMany
    @JoinTable(
            name = "REPORTE_CONTEO",
            joinColumns = @JoinColumn(name = "REPORTE_ID"),
            inverseJoinColumns = @JoinColumn(name = "CONTEO_ID")
    )
    private List<Conteo> conteos;

    @Column(name = "ACTIVO", nullable = false)
    private boolean activo = true;
}