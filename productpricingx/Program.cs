using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var jwt = builder.Configuration.GetRequiredSection("Jwt");
var issuer = jwt["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is required.");
var metadataAddress = jwt["MetadataAddress"]
    ?? throw new InvalidOperationException("Jwt:MetadataAddress is required.");
var jwksAddress = jwt["JwksAddress"] ?? throw new InvalidOperationException("Jwt:JwksAddress is required.");
var audience = jwt["Audience"] ?? throw new InvalidOperationException("Jwt:Audience is required.");
var signingKeys = new Lazy<IReadOnlyCollection<SecurityKey>>(() =>
{
    using var jwksClient = new HttpClient();
    var jwksDocument = jwksClient.GetStringAsync(jwksAddress).GetAwaiter().GetResult();
    return new JsonWebKeySet(jwksDocument).Keys.Cast<SecurityKey>().ToArray();
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MetadataAddress = metadataAddress;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = issuer,
            ValidateIssuer = true,
            ValidAudience = audience,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            // Keycloak advertises its public JWKS URL, which is not reachable as localhost from this container.
            IssuerSigningKeyResolver = (_, _, _, _) => signingKeys.Value
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("pricing-access", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.FindAll("scope")
                .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                .Contains(audience, StringComparer.Ordinal));
    });

builder.Services.AddHealthChecks();
builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.MapHealthChecks("/health/live").AllowAnonymous();
app.UseAuthentication();
app.UseAuthorization();
app.MapReverseProxy();

app.Run();
