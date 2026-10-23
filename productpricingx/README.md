# ProductPricingX

ProductPricingX is the authenticated local entry point for CoreBank Tarifario. It validates Keycloak access tokens and proxies the existing pricing routes to ProductPricingB.

The proxy removes `Authorization` before forwarding. ProductPricingB remains unauthenticated in the local development stack.

## Routes and request contract

The versioned experience entry point is `/product-pricing-x/v1`. The proxy removes
this prefix before forwarding to ProductPricingB. Routes without the prefix remain
available for existing CoreBank integrations.

For example, both requests reach the same ProductPricingB operation:

- `POST /product-pricing-x/v1/standard-rate-terms/evaluate`
- `POST /standard-rate-terms/evaluate`

The proxy preserves methods, query parameters, JSON bodies and response payloads.
Clients must send a valid bearer token and the required tracing headers:
`deviceIdentifier`, `messageIdentification` and `channelIdentification` (5 to 42
characters each). The proxy does not generate these headers.

The seven rate operations are:

| Method | Path relative to the entry point |
| --- | --- |
| `POST` | `/standard-rate-terms/evaluate` |
| `GET` | `/standard-rate-terms/refinancing/retrieve` |
| `GET` | `/standard-rate-terms/rescheduling/retrieve` |
| `POST` | `/negotiable-rate-terms/evaluate` |
| `GET` | `/negotiable-rate-terms/refinancing/retrieve` |
| `GET` | `/negotiable-rate-terms/special/evaluate` |
| `GET` | `/retention-rate-terms/retrieve` |

The nine maintenance operations use `/pricing-configuration-maintenance` relative
to the entry point. ProductPricingB forwards them to Discount Pricing under
`discount-pricing-s/v1/pricing-configuration-maintenance`.

`GET /health/live` checks ProductPricingX itself without authentication. The OpenAPI
document proxied from ProductPricingB describes B and advertises its own server
prefix, `/product-pricing-b/v1`; it is not a separate experience-layer contract.

## Configuration

- `Jwt__Issuer`: public token issuer used by CoreBank.
- `Jwt__MetadataAddress`: Keycloak metadata URL reachable from the ProductPricingX container.
- `Jwt__JwksAddress`: Keycloak JWKS URL reachable from the ProductPricingX container.
- `Jwt__Audience`: required access-token audience and scope.
