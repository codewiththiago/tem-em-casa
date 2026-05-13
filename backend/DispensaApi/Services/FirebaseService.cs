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
                // Parseia o JSON primeiro para extrair a private_key como string .NET
                // (o JsonDocument resolve os escape sequences do JSON corretamente)
                using var doc = JsonDocument.Parse(serviceAccountKey);
                var clientEmail = doc.RootElement.GetProperty("client_email").GetString()!;
                var privateKey  = doc.RootElement.GetProperty("private_key").GetString()!;

                // Algumas plataformas (Railway) double-escapam \n → o GetString() retorna
                // "\n" como dois chars (barra + n). Corrige para newline real.
                if (!privateKey.Contains('\n'))
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
