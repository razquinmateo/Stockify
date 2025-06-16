package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ConteoDto {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("fechaHora")
    private LocalDateTime fechaHora;

    @JsonProperty("conteoFinalizado")
    private Boolean conteoFinalizado;

    @JsonProperty("usuarioId")
    private Long usuarioId;

    @JsonProperty("activo")
    private Boolean activo;

    @JsonProperty("tipoConteo")
    private String tipoConteo;
}