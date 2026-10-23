# Entorno de desarrollo CLA

El stack inicia ProductPricingX, Product Pricing, Discount Pricing, Creditos, Keycloak, MongoDB, Kafka y Kafka UI.
SQL Server no se ejecuta en contenedor: Creditos se conecta a la instancia del host mediante `host.docker.internal:1433`.

## Inicio

1. Cree `.env` a partir de `.env.example` y complete `SQL_CONNECTION_STRING` con credenciales validas para la base CoreBank del host.
2. Ejecute:

```powershell
docker compose --env-file .env -f docker-compose.dev.yml up --build
```

## Servicios

| Servicio | URL local |
| --- | --- |
| Product Pricing | http://localhost:8000 |
| ProductPricingX | http://localhost:8003 |
| Discount Pricing | http://localhost:8001 |
| Creditos | http://localhost:8002 |
| Keycloak | http://localhost:8081 |
| Kafka UI | http://localhost:8088 |

ProductPricingX (`8003`) es la entrada autenticada normal. Product Pricing (`8000`), Discount Pricing (`8001`) y Creditos (`8002`) se publican solo en `127.0.0.1` para validaciones directas; no deben usarse como punto de entrada de integracion.

ProductPricingX admite el prefijo de experiencia `/product-pricing-x/v1` y lo elimina
antes de reenviar a Product Pricing. Por ejemplo,
`POST http://localhost:8003/product-pricing-x/v1/standard-rate-terms/evaluate`.
Las rutas sin prefijo siguen disponibles para la configuracion actual de CoreBank.
Las solicitudes requieren bearer token y los headers `deviceIdentifier`,
`messageIdentification` y `channelIdentification`, de 5 a 42 caracteres cada uno.
El contrato de rutas se detalla en [ProductPricingX](productpricingx/README.md).

## Trazabilidad Kafka

Product Pricing publica en el topico configurado por `KAFKA_TOPIC` (por defecto, `product-pricing-traces`) las llamadas HTTP salientes hacia Creditos y Discount Pricing. Kafka UI permite consultar el topico, sus mensajes y particiones en `http://localhost:8088`.

Kafka no publica un puerto en el host: Product Pricing y Kafka UI lo acceden exclusivamente mediante la red privada del stack en `kafka:9092`.

MongoDB tampoco publica un puerto en el host; Discount Pricing lo accede mediante la red privada en `mongo:27017`.

El servicio `trace-mongo-sink` consume el topico y registra cada mensaje en `SI_DBApibusEventHistory.MicroserviceCallTrace`. Conserva `requestPayload` como `null`, convierte `responsePayload` a BSON Binary y crea un indice unico sobre `identity` para evitar duplicados en reintentos.

## Autenticacion de Tarifario

Keycloak importa el realm `corebank-local` y crea el cliente confidencial `corebank-tarifario`. El secreto del cliente se configura desde `.env` al iniciar el stack.

Actualice la variable `cConfiguracionTarifario` en la base de datos CoreBank para que Tarifario solicite su token y llame a ProductPricingX:

```json
{
  "urlToken": "http://localhost:8081/realms/corebank-local/protocol/openid-connect/token",
  "clientId": "corebank-tarifario",
  "clientSecret": "<COREBANK_TARIFARIO_CLIENT_SECRET>",
  "scope": "product-pricing-x",
  "grantType": "client_credentials",
  "urlBase": "http://localhost:8003",
  "duracionTokenSegundos": 300
}
```

ProductPricingX valida el token y elimina el header `Authorization` antes de reenviar la solicitud a Product Pricing. Product Pricing queda sin autenticacion solo en este entorno local.

Los eventos se publican de forma best-effort: una caida de Kafka se registra en Product Pricing, pero no interrumpe la solicitud de negocio. El productor elimina `RequestPayload` antes de publicar; revise los mensajes antes de compartir el entorno porque se conserva la respuesta HTTP y sus metadatos de trazabilidad.

## Sentinel

Creditos se ejecuta en modo `Development` para usar la cadena SQL Server inyectada por Compose. Sentinel no recibe configuracion ni se llama mientras no se invoquen sus flujos especificos.
