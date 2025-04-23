package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LoteDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("numeroLote")
    private String numeroLote;

    @JsonProperty("fechaIngreso")
    private LocalDate fechaIngreso;

    @JsonProperty("fechaVencimiento")
    private LocalDate fechaVencimiento;

    @JsonProperty("activo")
    private Boolean activo;
}
