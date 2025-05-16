package tipy.Stockify.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class LoteDto {
    private Long id;
    private String numeroLote;
    private LocalDate fechaIngreso;
    private LocalDate fechaVencimiento;
    private Integer cantidadStock;
    private Boolean activo;
    private Long productoId;
}