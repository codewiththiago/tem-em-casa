using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

namespace DispensaApi.Services;

public class FirebaseService
{
    private readonly IConfiguration _cfg;
    private FirebaseAuth? _auth;

    public FirebaseService(IConfiguration cfg)
    {
        _cfg = cfg;
        TryInitialize();
    }

    private void TryInitialize()
    {
        try
        {
            if (FirebaseApp.DefaultInstance != null)
            {
                _auth = FirebaseAuth.DefaultInstance;
                return;
            }
            var serviceAccountKey = _cfg["Firebase:ServiceAccountKey"] ?? "";
            var projectId = _cfg["Firebase:ProjectId"] ?? "";

            if (string.IsNullOrWhiteSpace(projectId)) return;

            var credential = string.IsNullOrWhiteSpace(serviceAccountKey)
                ? GoogleCredential.GetApplicationDefault()
                : GoogleCredential.FromJson(serviceAccountKey);

            FirebaseApp.Create(new AppOptions { Credential = credential, ProjectId = projectId });
            _auth = FirebaseAuth.DefaultInstance;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[FirebaseService] Init skipped: {ex.Message}");
        }
    }

    public async Task<FirebaseToken> VerifyTokenAsync(string idToken)
    {
        if (_auth == null)
            throw new InvalidOperationException("Firebase não configurado. Defina Firebase:ProjectId e Firebase:ServiceAccountKey.");
        return await _auth.VerifyIdTokenAsync(idToken);
    }
}
