package tipy.Stockify.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConteoMensajeDto {
    private Long id;
    private String fechaHora;
}
