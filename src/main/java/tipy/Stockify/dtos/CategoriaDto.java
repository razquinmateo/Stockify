package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CategoriaDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("descripcion")
    private String descripcion;

    @JsonProperty("codigoCategoria")
    private String codigoCategoria;

    @JsonProperty("sucursalId")
    private Long sucursalId;

    @JsonProperty("activo")
    private Boolean activo;
}