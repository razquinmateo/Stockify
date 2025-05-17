package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SucursalProveedorDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("sucursalId")
    private Long sucursalId;

    @JsonProperty("proveedorId")
    private Long proveedorId;

    @JsonProperty("proveedorNombre")
    private String proveedorNombre;

    @JsonProperty("proveedorRut")
    private String proveedorRut;

    @JsonProperty("proveedorTelefono")
    private String proveedorTelefono;

    @JsonProperty("proveedorDireccion")
    private String proveedorDireccion;

    @JsonProperty("proveedorNombreVendedor")
    private String proveedorNombreVendedor;

    @JsonProperty("proveedorActivo")
    private Boolean proveedorActivo;
}