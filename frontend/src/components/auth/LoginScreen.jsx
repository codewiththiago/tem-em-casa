import { useState } from 'react';
import { signInWithEmail, registerWithEmail, firebaseErrorMsg } from '../../services/firebase';
import { loginWithFirebaseToken, createFamily, joinFamily, getFamily, getProducts } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function LoginScreen() {
  const setAuth       = useStore((s) => s.setAuth);
  const setFamily     = useStore((s) => s.setFamily);
  const setFamilyGroupId = useStore((s) => s.setFamilyGroupId);
  const setProducts   = useStore((s) => s.setProducts);

  const [step, setStep]     = useState('welcome'); // welcome | login | create | join
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Email/password fields (reused across steps)
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPass, setConfirmPass]   = useState('');

  // Create-specific
  const [familyName, setFamilyName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [pin, setPin]               = useState('');

  // Join-specific
  const [inviteCode, setInviteCode] = useState('');
  const [joinPin, setJoinPin]       = useState('');

  const goBack = () => { setStep('welcome'); setError(''); };

  // --- helpers ---
  const run = async (fn) => {
    setLoading(true); setError('');
    try { await fn(); }
    catch (e) {
      if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
        setError('Sem conexão com o servidor. Verifique se o app está rodando.');
      } else {
        const msg = e.response?.data?.message || firebaseErrorMsg(e);
        setError(`${msg} [${e.code || e.message || 'sem código'}]`);
      }
    }
    setLoading(false);
  };

  const finalizeLogin = async (data) => {
    setAuth({ id: data.user.id, name: data.user.name, email: data.user.email }, data.token, data.familyGroupId);
    if (data.familyGroupId) {
      setFamilyGroupId(data.familyGroupId);
      const [{ group }, prods] = await Promise.all([
        getFamily(data.familyGroupId),
        getProducts(data.familyGroupId),
      ]);
      setFamily(group);
      setProducts(prods);
    }
  };

  // --- validations ---
  const validateEmail = () => {
    if (!email.trim()) { setError('Informe o e-mail.'); return false; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return false; }
    return true;
  };
  const validateGroupFields = () => {
    if (!familyName.trim()) { setError('Informe o nome da família.'); return false; }
    if (!memberName.trim()) { setError('Informe seu nome.'); return false; }
    if (!/^\d{4}$/.test(pin)) { setError('PIN deve ter 4 dígitos.'); return false; }
    return true;
  };
  const validateJoinFields = () => {
    if (inviteCode.trim().length !== 6) { setError('Código deve ter 6 caracteres.'); return false; }
    if (!/^\d{4}$/.test(joinPin)) { setError('PIN deve ter 4 dígitos.'); return false; }
    return true;
  };

  // --- login (step='login') ---
  const doLogin = () => run(async () => {
    if (!validateEmail()) return;
    const { idToken } = await signInWithEmail(email, password);
    const data = await loginWithFirebaseToken(idToken);
    await finalizeLogin(data);
  });

  // --- create (step='create') ---
  const doCreate = () => run(async () => {
    if (!validateGroupFields()) return;
    if (!validateEmail()) return;
    if (password !== confirmPass) { setError('As senhas não coincidem.'); return; }
    const { idToken } = await registerWithEmail(email, password);
    const data = await loginWithFirebaseToken(idToken);
    setAuth({ id: data.user.id, name: memberName.trim() }, data.token, null);
    const { group } = await createFamily(familyName.trim(), pin);
    setFamily(group);
    setAuth({ id: data.user.id, name: memberName.trim() }, data.token, group.id);
    setFamilyGroupId(group.id);
  });

  // --- join (step='join') ---
  const doJoin = () => run(async () => {
    if (!validateJoinFields()) return;
    if (!validateEmail()) return;
    const { idToken } = await signInWithEmail(email, password);
    const data = await loginWithFirebaseToken(idToken);
    setAuth({ id: data.user.id, name: data.user.name }, data.token, null);
    const { group } = await joinFamily(inviteCode.trim().toUpperCase(), joinPin);
    setFamily(group);
    setAuth({ id: data.user.id, name: data.user.name }, data.token, group.id);
    setFamilyGroupId(group.id);
  });

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-logo">🏡</div>
        <div className="auth-title">Tem em Casa</div>
        <div className="auth-subtitle">Controle de estoque para toda a família</div>
        <div className="auth-brand">por Querência Labs</div>
      </div>

      <div className="auth-body">
        {error && <div className="auth-error">{error}</div>}

        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <>
            <div className="auth-card">
              <div className="auth-card-title">👋 Já tenho conta</div>
              <div className="auth-card-sub">Entre com sua conta para acessar o estoque da família.</div>
              <button className="btn-primary" onClick={() => setStep('login')}>Entrar →</button>
            </div>
            <div className="auth-or">── primeira vez? ──</div>
            <div className="auth-card">
              <div className="auth-card-title">✨ Criar grupo familiar</div>
              <div className="auth-card-sub">Configure seu estoque e compartilhe com a família.</div>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg,#34D399,#059669)' }}
                onClick={() => setStep('create')}
              >
                Criar grupo →
              </button>
            </div>
            <div className="auth-card" style={{ marginTop: 10 }}>
              <div className="auth-card-title">🔗 Entrar com código</div>
              <div className="auth-card-sub">Tem o código de um grupo? Entre sem criar um novo.</div>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg,#60A5FA,#2563EB)' }}
                onClick={() => setStep('join')}
              >
                Entrar com código →
              </button>
            </div>
          </>
        )}

        {/* ── Login ── */}
        {step === 'login' && (
          <div className="auth-card">
            <div className="auth-field">
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="auth-field">
              <label>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <button className="btn-primary" onClick={doLogin} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
            <button className="btn-secondary" onClick={goBack}>Voltar</button>
          </div>
        )}

        {/* ── Create ── */}
        {step === 'create' && (
          <div className="auth-card">
            <div className="auth-field">
              <label>Nome da família</label>
              <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Ex: Família Silva" />
            </div>
            <div className="auth-field">
              <label>Seu nome</label>
              <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Como você quer ser chamado?" />
            </div>
            <div className="auth-field">
              <label>PIN do grupo (4 dígitos)</label>
              <input
                className="pin-input" type="password" inputMode="numeric" maxLength={4}
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
              <div className="auth-hint">A família vai usar esse PIN para entrar</div>
            </div>
            <div className="auth-field">
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="auth-field">
              <label>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="auth-field">
              <label>Confirmar senha</label>
              <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Repita a senha" />
            </div>
            <button className="btn-primary" onClick={doCreate} disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta e grupo 🎉'}
            </button>
            <button className="btn-secondary" onClick={goBack}>Voltar</button>
          </div>
        )}

        {/* ── Join ── */}
        {step === 'join' && (
          <div className="auth-card">
            <div className="auth-field">
              <label>Código do grupo</label>
              <input
                className="code-input" maxLength={6} value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="ABCD12"
              />
              <div className="auth-hint">6 caracteres, peça para quem criou o grupo</div>
            </div>
            <div className="auth-field">
              <label>PIN do grupo</label>
              <input
                className="pin-input" type="password" inputMode="numeric" maxLength={4}
                value={joinPin} onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
            </div>
            <div className="auth-field">
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="auth-field">
              <label>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg,#60A5FA,#2563EB)' }}
              onClick={doJoin}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
            <button className="btn-secondary" onClick={goBack}>Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
}
