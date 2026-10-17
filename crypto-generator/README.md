# Crypto Generator

Genera valores Base64 compatibles con `Cryptography.encryptString` y `CryptoCommon.encryptString` de Creditos.

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- "plain-text"
```

Use la salida para `DB_USER`, `DB_PASSWORD`, `SENTINEL_KEYCLOAK_AUTH_CLIENT` y `SENTINEL_KEYCLOAK_AUTH_CLIENT_SECRET` del entorno de certificacion. No guarde valores reales en archivos versionados.

Para codificar texto UTF-8 a Base64 sin cifrado:

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- --base64 "plain-text"
```
