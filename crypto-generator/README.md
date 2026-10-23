# Crypto Generator

Genera valores Base64 compatibles con `Cryptography.encryptString` y `CryptoCommon.encryptString` de Creditos.

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- "plain-text"
```

Use la salida para `DB_USER`, `DB_PASSWORD`, `SENTINEL_KEYCLOAK_AUTH_CLIENT` y `SENTINEL_KEYCLOAK_AUTH_CLIENT_SECRET` del entorno de certificacion. No guarde valores reales en archivos versionados.

Para desencriptar un valor cifrado en Base64:

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- --decrypt "texto-cifrado-base64"
```

La salida es el texto UTF-8 original, sin espacios en blanco al inicio ni al final, igual que en `decryptString` de Creditos. Si el valor esta vacio, no es Base64 valido o no puede descifrarse, se escribe un error en stderr y se devuelve el codigo de salida `1`.

Para codificar texto UTF-8 a Base64 sin cifrado:

```powershell
dotnet run --project .\crypto-generator\CryptoGenerator.csproj -- --base64 "plain-text"
```
