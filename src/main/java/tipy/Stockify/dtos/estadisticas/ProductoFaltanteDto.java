package tipy.Stockify.dtos.estadisticas;

public class ProductoFaltanteDto {

    private Long productoId;
    private String nombreProducto;
    private Long cantidadFaltante;

    public ProductoFaltanteDto() { }

    public ProductoFaltanteDto(Long productoId, String nombreProducto, Long cantidadFaltante) {
        this.productoId       = productoId;
        this.nombreProducto   = nombreProducto;
        this.cantidadFaltante = cantidadFaltante;
    }

    public Long getProductoId() {
        return productoId;
    }
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }
    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public Long getCantidadFaltante() {
        return cantidadFaltante;
    }
    public void setCantidadFaltante(Long cantidadFaltante) {
        this.cantidadFaltante = cantidadFaltante;
    }
}