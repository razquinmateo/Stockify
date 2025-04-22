package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Lote;
import tipy.Stockify.business.repositories.LoteRepository;
import tipy.Stockify.dtos.LoteDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoteService {

    private final LoteRepository loteRepository;

    public LoteService(LoteRepository loteRepository) {
        this.loteRepository = loteRepository;
    }

    public List<LoteDto> getAll() {
        return loteRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LoteDto getById(Long id) {
        return loteRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public LoteDto create(LoteDto loteDto) {
        Lote lote = mapToEntity(loteDto);
        return mapToDto(loteRepository.save(lote));
    }

    public LoteDto update(Long id, LoteDto loteDto) {
        if (loteRepository.existsById(id)) {
            Lote lote = mapToEntity(loteDto);
            lote.setId(id);
            return mapToDto(loteRepository.save(lote));
        }
        return null;
    }

    public void delete(Long id) {
        loteRepository.deleteById(id);
    }

    public Lote mapToEntity(LoteDto loteDto) {
        Lote lote = new Lote();
        lote.setNumeroLote(loteDto.getNumeroLote());
        lote.setFechaIngreso(loteDto.getFechaIngreso());
        lote.setFechaVencimiento(loteDto.getFechaVencimiento());
        return lote;
    }

    public LoteDto mapToDto(Lote lote) {
        LoteDto loteDto = new LoteDto();
        loteDto.setId(lote.getId());
        loteDto.setNumeroLote(lote.getNumeroLote());
        loteDto.setFechaIngreso(lote.getFechaIngreso());
        loteDto.setFechaVencimiento(lote.getFechaVencimiento());
        return loteDto;
    }
}