package tipy.Stockify.business.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

import java.util.Date;

@Entity
@Data
@Table(name = "LOTE")
public class Lote {

    @Id
    @Column(name = "ID_LOTE")
    private long id;

    @Column(name = "NUMERO_LOTE")
    private String numeroLote;

    @Column(name = "FECHA_INGRESO")
    private Date fechaIngreso;

    @Column(name = "FECHA_VENCIMIENTO")
    private Date fechaVencimiento;

}
