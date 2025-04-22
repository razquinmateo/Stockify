package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Reporte;
import tipy.Stockify.business.repositories.ReporteRepository;
import tipy.Stockify.dtos.ReporteDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepository;

    public ReporteService(ReporteRepository reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    public List<ReporteDto> getAll() {
        return reporteRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ReporteDto getById(Long id) {
        return reporteRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ReporteDto create(ReporteDto reporteDto) {
        Reporte reporte = mapToEntity(reporteDto);
        return mapToDto(reporteRepository.save(reporte));
    }

    public ReporteDto update(Long id, ReporteDto reporteDto) {
        if (reporteRepository.existsById(id)) {
            Reporte reporte = mapToEntity(reporteDto);
            reporte.setId(id);
            return mapToDto(reporteRepository.save(reporte));
        }
        return null;
    }

    public void delete(Long id) {
        reporteRepository.deleteById(id);
    }

    public Reporte mapToEntity(ReporteDto reporteDto) {
        Reporte reporte = new Reporte();
        reporte.setFechaGeneracion(reporteDto.getFechaGeneracion());
        reporte.setTotalFaltante(reporteDto.getTotalFaltante());
        reporte.setTotalSobrante(reporteDto.getTotalSobrante());
        reporte.setDiferenciaMonetaria(reporteDto.getDiferenciaMonetaria());
        return reporte;
    }

    public ReporteDto mapToDto(Reporte reporte) {
        ReporteDto reporteDto = new ReporteDto();
        reporteDto.setId(reporte.getId());
        reporteDto.setFechaGeneracion(reporte.getFechaGeneracion());
        reporteDto.setTotalFaltante(reporte.getTotalFaltante());
        reporteDto.setTotalSobrante(reporte.getTotalSobrante());
        reporteDto.setDiferenciaMonetaria(reporte.getDiferenciaMonetaria());
        return reporteDto;
    }
}