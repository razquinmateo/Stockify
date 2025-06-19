package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

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

    @JsonProperty("categoriaIds")
    private List<Long> categoriaIds; // para las categorías seleccionadas
}