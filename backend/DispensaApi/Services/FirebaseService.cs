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
                // Suporta valor em base64 (evita problemas de escape em env vars)
                string jsonKey;
                try
                {
                    // Strip whitespace Railway may insert into long env vars (line breaks every ~76 chars)
                    var cleanB64 = serviceAccountKey.Replace("\n", "").Replace("\r", "").Replace(" ", "");
                    jsonKey = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cleanB64));
                }
                catch
                {
                    // Not base64 — use raw JSON, but escape literal newlines inside string values
                    // (Railway converts \n escape sequences in JSON strings to real 0x0A bytes)
                    jsonKey = FixLiteralNewlinesInJsonStrings(serviceAccountKey);
                }

                using var doc = JsonDocument.Parse(jsonKey);
                var clientEmail = doc.RootElement.GetProperty("client_email").GetString()!;
                var privateKey  = doc.RootElement.GetProperty("private_key").GetString()!;

                // Corrige \n literal (dois chars) para newline real
                if (!privateKey.Contains('\n'))
                    privateKey = privateKey.Replace("\\n", "\n");

                // Normaliza o PEM caso Railway tenha quebrado o header/footer no meio
                privateKey = NormalizePemKey(privateKey);

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

    // Strips all whitespace, finds PEM markers, extracts base64 content and re-wraps at 64 chars.
    // Handles any line-break corruption Railway may introduce in the key value.
    private static string NormalizePemKey(string key)
    {
        var flat = System.Text.RegularExpressions.Regex.Replace(key, @"\s+", "");
        const string begin = "-----BEGINPRIVATEKEY-----";
        const string end   = "-----ENDPRIVATEKEY-----";
        var beginIdx = flat.IndexOf(begin, StringComparison.Ordinal);
        var endIdx   = flat.IndexOf(end,   StringComparison.Ordinal);
        if (beginIdx < 0 || endIdx < 0) return key;

        var b64 = flat[(beginIdx + begin.Length)..endIdx];
        var sb  = new System.Text.StringBuilder();
        sb.AppendLine("-----BEGIN PRIVATE KEY-----");
        for (int i = 0; i < b64.Length; i += 64)
            sb.AppendLine(b64.Substring(i, Math.Min(64, b64.Length - i)));
        sb.Append("-----END PRIVATE KEY-----");
        return sb.ToString();
    }

    // Scans JSON character-by-character and escapes literal 0x0A/0x0D inside string values.
    // Structural newlines (between keys) are left intact; only those inside quoted strings are fixed.
    private static string FixLiteralNewlinesInJsonStrings(string json)
    {
        var sb = new System.Text.StringBuilder(json.Length);
        bool inString = false;
        for (int i = 0; i < json.Length; i++)
        {
            char c = json[i];
            if (c == '\\' && inString)
            {
                sb.Append(c);
                if (i + 1 < json.Length) sb.Append(json[++i]);
                continue;
            }
            if (c == '"') { inString = !inString; sb.Append(c); continue; }
            if (inString && c == '\n') { sb.Append("\\n"); continue; }
            if (inString && c == '\r') continue;
            sb.Append(c);
        }
        return sb.ToString();
    }

    public async Task<FirebaseToken> VerifyTokenAsync(string idToken)
    {
        if (_auth == null)
            throw new InvalidOperationException("Firebase não configurado. Defina Firebase:ProjectId e Firebase:ServiceAccountKey.");
        return await _auth.VerifyIdTokenAsync(idToken);
    }
}
