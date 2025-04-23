package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.UsuarioDto;
import tipy.Stockify.services.UsuarioService;

import java.util.List;

// http://localhost:8080/api/v1/usuarios

@RestController
@RequestMapping(value = "api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de usuarios activos.")
    public ResponseEntity<List<UsuarioDto>> getActiveUsuarios() {
        return new ResponseEntity<>(usuarioService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los usuarios, incluidos los inactivos.")
    public ResponseEntity<List<UsuarioDto>> getAllUsuariosIncludingInactive() {
        return new ResponseEntity<>(usuarioService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un usuario activo por su ID.")
    public ResponseEntity<UsuarioDto> getUsuarioById(@PathVariable Long id) {
        UsuarioDto usuario = usuarioService.getById(id);
        return usuario != null
                ? new ResponseEntity<>(usuario, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo usuario.")
    public ResponseEntity<UsuarioDto> createUsuario(@RequestBody UsuarioDto usuarioDto) {
        return new ResponseEntity<>(usuarioService.create(usuarioDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un usuario existente.")
    public ResponseEntity<UsuarioDto> updateUsuario(@PathVariable Long id, @RequestBody UsuarioDto usuarioDto) {
        UsuarioDto updated = usuarioService.update(id, usuarioDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un usuario por su ID.")
    public ResponseEntity<Void> deactivateUsuario(@PathVariable Long id) {
        usuarioService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}