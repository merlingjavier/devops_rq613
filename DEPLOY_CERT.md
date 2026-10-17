# Despliegue de Certificacion

Este documento describe los valores y la preparacion requeridos para `docker-compose.cert.yml`. Las contrasenas reales no deben guardarse en el repositorio.

## Creditos en Produccion

Creditos requiere `DB_SERVER`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` cuando `ASPNETCORE_ENVIRONMENT=Production`. Los dos ultimos valores deben cifrarse con la utilidad incluida:

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- "database-user"
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- "database-password"
```

Copie las salidas Base64 en `DB_USER` y `DB_PASSWORD` del archivo secreto de certificacion.

Sentinel no se usa en certificacion, pero la aplicacion exige sus variables al iniciar en produccion. Use URLs ficticias no enrutable y genere valores cifrados para los dos campos siguientes:

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- "disabled-sentinel-client"
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- "disabled-sentinel-secret"
```

Asigne las salidas a `SENTINEL_KEYCLOAK_AUTH_CLIENT` y `SENTINEL_KEYCLOAK_AUTH_CLIENT_SECRET`. No invoque los endpoints que consumen Sentinel en este entorno.

## Bases de Datos Externas

`docker-compose.cert.yml` no levanta MongoDB ni SQL Server. Los contenedores se conectan a las instancias del host mediante:

```text
SQL Server: host.docker.internal,1433
MongoDB: host.docker.internal:27017
```

Configure `DB_SERVER`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` para la instancia SQL Server del host.

## Usuarios MongoDB

MongoDB debe tener autenticacion activa antes de iniciar Discount Pricing y el sink de trazas. Un administrador de MongoDB debe ejecutar los scripts despues de que el servidor este disponible:

```powershell
mongosh "mongodb://<admin-user>:<admin-password>@<mongo-host>:27017/admin" --file .\mongodb\create-mongodb-users__discountpricings.js
mongosh "mongodb://<admin-user>:<admin-password>@<mongo-host>:27017/admin" --file .\mongodb\create-mongodb-user__traces.js
```

El primer script define los roles sobre `discountpricing`, pero crea los usuarios de consulta y mantenimiento en la base de autenticacion `admin`. Esto es compatible con la URI Mongo que construye Discount Pricing actualmente.

El segundo script crea o actualiza:

- Usuario `product-pricing-trace-writer` en `admin`, limitado a `insert` y `update` sobre `SI_DBApibusEventHistory.MicroserviceCallTrace`.

La base, coleccion e indice ya deben existir en el servidor MongoDB de certificacion. El sink no intenta crear indices en certificacion. Si hace falta crear el indice unico, el administrador debe ejecutar una sola vez:

```javascript
db.getSiblingDB("SI_DBApibusEventHistory")
  .MicroserviceCallTrace
  .createIndex({ identity: 1 }, { name: "identity_unique", unique: true });
```

El usuario del sink debe conectarse con una URI equivalente a:

```text
mongodb://product-pricing-trace-writer:<password>@host.docker.internal:27017/SI_DBApibusEventHistory?authSource=admin
```

## Variables de Certificacion

Parta de `.env.cert.example` para crear el archivo secreto utilizado por el compose de certificacion. Mantenga el archivo real fuera del control de versiones.

Los nombres Mongo de Discount Pricing deben alinearse con los scripts:

```text
MONGO_QUERY_DB_NAME=discountpricing
MONGO_QUERY_DB_USER=discount-pricing-query
MONGO_QUERY_DB_PASSWORD=discount-pricing-query-password
MONGO_MAINTENANCE_DB_NAME=discountpricing
MONGO_MAINTENANCE_DB_USER=discount-pricing-maintenance
MONGO_MAINTENANCE_DB_PASSWORD=discount-pricing-maintenance-password
```

La URI de trazas debe usar el host externo y la base de autenticacion de historial:

```text
MONGO_TRACE_CONNECTION_STRING=mongodb://product-pricing-trace-writer:<password>@host.docker.internal:27017/SI_DBApibusEventHistory?authSource=admin
```

## Inicio

1. Cree `.env.cert` a partir de `.env.cert.example` y reemplace sus valores de ejemplo.
2. Ejecute los scripts Mongo contra la instancia del host.
3. Inicie el entorno:

```powershell
docker compose --env-file .env.cert -f docker-compose.cert.yml up --build
```

Los puertos publicados para gestion son Keycloak `8081`, Kafka UI `8088` y ProductPricingX `8003`.

Product Pricing `8100`, Discount Pricing `8101` y Creditos `8102` se publican exclusivamente en `127.0.0.1` para validaciones directas del equipo de certificacion. Este rango es distinto del usado por Desarrollo (`8000`-`8002`), por lo que ambos entornos pueden ejecutarse simultaneamente. ProductPricingX sigue siendo la entrada autenticada normal; los servicios intermedios no deben exponerse a la red ni utilizarse como punto de integracion.
