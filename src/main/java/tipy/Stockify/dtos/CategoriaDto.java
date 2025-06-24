package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import lombok.Data;

@Data
public class CategoriaDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("id_categoria")
    private String idCategoria;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("descripcion")
    private String descripcion;

    @JsonProperty("sucursalId")
    private Long sucursalId;

    @JsonProperty("activo")
    private Boolean activo;
}
