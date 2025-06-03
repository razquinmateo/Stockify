package tipy.Stockify.dtos;

public class DineroSobranteMesDto {
    private Integer mes;
    private Double totalSobrante;

    public DineroSobranteMesDto(Integer mes, Double totalSobrante) {
        this.mes = mes;
        this.totalSobrante = totalSobrante;
    }

    public Integer getMes() { return mes; }
    public void setMes(Integer mes) { this.mes = mes; }

    public Double getTotalSobrante() { return totalSobrante; }
    public void setTotalSobrante(Double totalSobrante) { this.totalSobrante = totalSobrante; }
}
