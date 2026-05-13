using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

namespace DispensaApi.Services;

public class FirebaseService
{
    private readonly IConfiguration _cfg;
    private FirebaseAuth? _auth;
    private string? _initError;

    public FirebaseService(IConfiguration cfg)
    {
        _cfg = cfg;
        TryInitialize();
    }

    public string? InitError => _initError;

    private void TryInitialize()
    {
        try
        {
            if (FirebaseApp.DefaultInstance != null)
            {
                _auth = FirebaseAuth.DefaultInstance;
                return;
            }
            var serviceAccountKey = _cfg["Firebase:ServiceAccountKey"]
                ?? Environment.GetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_KEY")
                ?? "";
            var projectId = _cfg["Firebase:ProjectId"]
                ?? Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID")
                ?? "";

            if (string.IsNullOrWhiteSpace(projectId)) return;

            // Algumas plataformas (Railway) double-escapam \n em env vars
            serviceAccountKey = serviceAccountKey.Replace("\\n", "\n");

            var credential = string.IsNullOrWhiteSpace(serviceAccountKey)
                ? GoogleCredential.GetApplicationDefault()
                : GoogleCredential.FromJson(serviceAccountKey);

            FirebaseApp.Create(new AppOptions { Credential = credential, ProjectId = projectId });
            _auth = FirebaseAuth.DefaultInstance;
        }
        catch (Exception ex)
        {
            _initError = ex.Message;
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
