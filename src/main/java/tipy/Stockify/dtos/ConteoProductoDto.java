package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ConteoProductoDto {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("precioActual")
    private float precioActual;

    @JsonProperty("cantidadEsperada")
    private Integer cantidadEsperada;

    @JsonProperty("cantidadContada")
    private Integer cantidadContada;

    @JsonProperty("conteoId")
    private Long conteoId;

    @JsonProperty("productoId")
    private Long productoId;
}
