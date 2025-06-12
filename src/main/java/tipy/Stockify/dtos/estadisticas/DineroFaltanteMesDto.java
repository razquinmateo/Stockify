package tipy.Stockify.dtos.estadisticas;

public class DineroFaltanteMesDto {

    private Integer mes;          // mes del año (1..12)
    private Double totalFaltante; // lo guardamos internamente como Double

    public DineroFaltanteMesDto() { }

    public DineroFaltanteMesDto(Integer mes, Number totalFaltante) {
        this.mes = mes;
        this.totalFaltante = (totalFaltante == null ? 0.0 : totalFaltante.doubleValue());
    }

    public Integer getMes() {
        return mes;
    }

    public void setMes(Integer mes) {
        this.mes = mes;
    }

    public Double getTotalFaltante() {
        return totalFaltante;
    }

    public void setTotalFaltante(Double totalFaltante) {
        this.totalFaltante = totalFaltante;
    }
}