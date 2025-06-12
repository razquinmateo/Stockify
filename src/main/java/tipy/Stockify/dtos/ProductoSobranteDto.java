package tipy.Stockify.dtos;

public class ProductoSobranteDto {

    private Long productoId;
    private String nombreProducto;
    private Long cantidadSobrante;

    public ProductoSobranteDto() { }

    public ProductoSobranteDto(Long productoId, String nombreProducto, Long cantidadSobrante) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidadSobrante = cantidadSobrante;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public Long getCantidadSobrante() { return cantidadSobrante; }
    public void setCantidadSobrante(Long cantidadSobrante) { this.cantidadSobrante = cantidadSobrante; }
}