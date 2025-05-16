package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "LOTE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "NUMERO_LOTE", nullable = false, unique = true)
    private String numeroLote;

    @Column(name = "FECHA_INGRESO", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "FECHA_VENCIMIENTO")
    private LocalDate fechaVencimiento;

    @Column(name = "CANTIDAD_STOCK", nullable = false)
    private Integer cantidadStock;

    @Column(name = "ACTIVO", nullable = false)
    private Boolean activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCTO_ID", nullable = false)
    private Producto producto;
}