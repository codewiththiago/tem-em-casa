using DispensaApi.Services;

namespace DispensaApi.Tests.Infrastructure;

// Fake token format used in tests: "uid|name|email"
// Pass "invalid" to simulate an auth failure.
public class FakeFirebaseService : IFirebaseService
{
    public string? InitError => null;

    public Task<FirebaseTokenData> VerifyTokenAsync(string idToken)
    {
        if (idToken == "invalid")
            throw new Exception("Token inválido ou expirado.");

        var parts = idToken.Split('|');
        var uid   = parts.ElementAtOrDefault(0) ?? "test-uid";
        var name  = parts.ElementAtOrDefault(1) ?? "Test User";
        var email = parts.ElementAtOrDefault(2) ?? "test@example.com";

        var claims = new Dictionary<string, object> { ["name"] = name, ["email"] = email };
        return Task.FromResult(new FirebaseTokenData(uid, claims));
    }
}
