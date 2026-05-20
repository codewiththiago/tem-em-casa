namespace DispensaApi.Services;

public record FirebaseTokenData(string Uid, IReadOnlyDictionary<string, object> Claims);

public interface IFirebaseService
{
    string? InitError { get; }
    bool IsReady { get; }
    Task<FirebaseTokenData> VerifyTokenAsync(string idToken);
}
