package tipy.Stockify.api.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ConteoUsuarioDto;
import tipy.Stockify.dtos.UsuarioDto;
import tipy.Stockify.services.ConteoUsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conteo-usuarios")
public class ConteoUsuarioController {

    @Autowired
    private ConteoUsuarioService conteoUsuarioService;

    @GetMapping("/por-conteo/{conteoId}")
    public List<UsuarioDto> obtenerUsuariosPorConteo(@PathVariable Long conteoId) {
        return conteoUsuarioService.obtenerUsuariosPorConteo(conteoId);
    }

    /** inserta en la tabla pivote */
    @PostMapping("/conteo/{conteoId}/usuario/{usuarioId}")
    public ConteoUsuarioDto addParticipante(
            @PathVariable Long conteoId,
            @PathVariable Long usuarioId
    ) {
        return conteoUsuarioService.addParticipante(conteoId, usuarioId);
    }
}