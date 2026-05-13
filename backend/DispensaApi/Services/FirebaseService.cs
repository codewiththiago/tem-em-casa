using System.Text.Json;
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

            GoogleCredential credential;
            if (string.IsNullOrWhiteSpace(serviceAccountKey))
            {
                credential = GoogleCredential.GetApplicationDefault();
            }
            else
            {
                // Railway converte \n do JSON em newlines reais ao salvar a env var,
                // quebrando o JSON. Reescapamos antes de parsear.
                var safeJson = serviceAccountKey
                    .Replace("\r\n", "\\n")
                    .Replace("\r",   "\\n")
                    .Replace("\n",   "\\n");

                using var doc = JsonDocument.Parse(safeJson);
                var clientEmail = doc.RootElement.GetProperty("client_email").GetString()!;
                var privateKey  = doc.RootElement.GetProperty("private_key").GetString()!;

                // Após parsear, private_key pode ter \n como dois chars — converte para newline real
                privateKey = privateKey.Replace("\\n", "\n");

                var saCred = new ServiceAccountCredential(
                    new ServiceAccountCredential.Initializer(clientEmail)
                        .FromPrivateKey(privateKey));

                credential = GoogleCredential.FromServiceAccountCredential(saCred);
            }

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
