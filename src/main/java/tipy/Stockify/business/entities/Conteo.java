package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@Entity
@Data
@Table(name = "CONTEO")
public class Conteo {

    @Id
    @Column(name = "ID_CONTEO")
    private long id;

    @Column(name = "FECHA_CONTEO")
    private Date fecha;

    @Transient //No se crea la columna en la base de datos
    private Boolean conteoFinalizado;

}
