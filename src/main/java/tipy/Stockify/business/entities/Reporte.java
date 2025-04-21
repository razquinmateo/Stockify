package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.util.Date;

@Entity
@Data
@Table(name = "REPORTE")
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "reporte_id_seq", sequenceName = "reporte_seq", allocationSize = 1)
    @Column(name = "ID_REPORTE")
    private long id;

    @Column(name = "FECHA_GENERACION")
    private Date fecha;

    @Column(name = "TOTAL_FALTANTE")
    private Float totalFaltante;

    @Column(name = "TOTAL_SOBRANTE")
    private Float totalSobrante;

    @Column(name = "DIFENRECIA_MONETARIA")
    private Float diferenciaMonetaria;

}
