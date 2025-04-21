package tipy.Stockify.api.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import tipy.Stockify.dtos.UsuarioDto;

import java.util.List;

@Data
public class ResponseUsuarios {

    @JsonProperty(value = "ListadoUsuarios")
    private List<UsuarioDto> usuarios;

}
