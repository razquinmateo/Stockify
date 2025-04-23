package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ConteoProductoDto {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("precioActual")
    private Float precioActual;

    @JsonProperty("cantidadEsperada")
    private Integer cantidadEsperada;

    @JsonProperty("cantidadContada")
    private Integer cantidadContada;

    @JsonProperty("conteoId")
    private Long conteoId;

    @JsonProperty("productoId")
    private Long productoId;

    @JsonProperty("activo")
    private Boolean activo;
}
