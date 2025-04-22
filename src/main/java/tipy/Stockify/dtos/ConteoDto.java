package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ConteoDto {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("fechaHora")
    private LocalDate fechaHora;

    @JsonProperty("conteoFinalizado")
    private boolean conteoFinalizado;

    @JsonProperty("usuarioId")
    private Long usuarioId;
}
