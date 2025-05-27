package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ConteoUsuarioDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("conteoId")
    private Long conteoId;

    @JsonProperty("usuarioId")
    private Long usuarioId;

    @JsonProperty("nombreUsuario")
    private String nombreUsuario;

}
