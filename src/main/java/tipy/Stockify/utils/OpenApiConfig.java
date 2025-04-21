package tipy.Stockify.utils;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    // Para acceder a swagger -> localhost:8080/Stockify/swagger-ui/index.html

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("Stockify")
                .pathsToMatch("/api/**")
                .build();
    }

    @Bean
    public OpenAPI customizeOpenApi() {
        return new OpenAPI().info(
                new Info().version("v1").description("api test Stockify")
                        .title("api test")
                        .summary("tipy")
        );
    }

}
