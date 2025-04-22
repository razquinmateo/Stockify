package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReporteDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("fechaGeneracion")
    private LocalDate fechaGeneracion;

    @JsonProperty("totalFaltante")
    private float totalFaltante;

    @JsonProperty("totalSobrante")
    private float totalSobrante;

    @JsonProperty("diferenciaMonetaria")
    private float diferenciaMonetaria;
}
