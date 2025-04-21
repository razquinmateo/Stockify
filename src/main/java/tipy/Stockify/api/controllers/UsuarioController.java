package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.api.responses.ResponseUsuarios;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.dtos.UsuarioDto;
import tipy.Stockify.services.UsuarioService;

// http://localhost:8080/api/v1/usuarios

@RestController
@RequestMapping(value = "api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // Agregar todos los metodos (get, post, ...)

    // Metodo get para obtener la lista desde el servicio
    @GetMapping
    @Operation(description = "Esta funcion obtiene la lista de usuarios.")
    public ResponseEntity<ResponseUsuarios> getUsuarios() {
        ResponseUsuarios responseUsuarios = usuarioService.listadoUsuarios();
        return new ResponseEntity<>(responseUsuarios, HttpStatus.OK);
    }

    // Metodo post para crear un usuario
    @PostMapping
    @Operation(description = "Esta funcion permite crear un nuevo usuario.")
    public ResponseEntity<String> crearUsuario(@RequestBody UsuarioDto nuevoUsuario) {
        String response = usuarioService.crearUsuario(nuevoUsuario);

        if (response == null) {
            return new ResponseEntity<>( "Error al crear el nuevo usuario.",HttpStatus.BAD_REQUEST);
        } else {
            return new ResponseEntity<>(response,HttpStatus.CREATED);
        }
    }

    // Metodo delete para eliminar un usuario
    @DeleteMapping("/{idUsuario}")
    @Operation(description = "Esta funcion permite eliminar un usuario.")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable(name = "idUsuario") Long idUsuario) {
        usuarioService.eliminarUsuario(idUsuario);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    // Metodo put para modificar un usuario
    @PutMapping("{idUsuario}")
    @Operation(description = "Esta funcion permite modificar un usuario.")
    public ResponseEntity<String> modificarUsuario(@PathVariable(name = "idUsuario") Long idUsuario, @RequestBody UsuarioDto usuario) {
        String response = usuarioService.modificarUsuario(idUsuario, usuario);

        if (response == null) {
            return new ResponseEntity<>( "Error al modificar usuario",HttpStatus.BAD_REQUEST);
        } else {
            return new ResponseEntity<>(response,HttpStatus.CREATED);
        }
    }

}
