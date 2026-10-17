# ProductPricingX

ProductPricingX is the authenticated local entry point for CoreBank Tarifario. It validates Keycloak access tokens and proxies the existing pricing routes to ProductPricingB.

The proxy removes `Authorization` before forwarding. ProductPricingB remains unauthenticated in the local development stack.

## Configuration

- `Jwt__Issuer`: public token issuer used by CoreBank.
- `Jwt__MetadataAddress`: Keycloak metadata URL reachable from the ProductPricingX container.
- `Jwt__JwksAddress`: Keycloak JWKS URL reachable from the ProductPricingX container.
- `Jwt__Audience`: required access-token audience and scope.
