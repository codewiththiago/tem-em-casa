import { useState } from 'react';
import { signInWithEmail, registerWithEmail, firebaseErrorMsg } from '../../services/firebase';
import { loginWithFirebaseToken, createFamily, joinFamily, getFamily, getProducts } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function LoginScreen() {
  const setAuth          = useStore((s) => s.setAuth);
  const setFamily        = useStore((s) => s.setFamily);
  const setFamilyGroupId = useStore((s) => s.setFamilyGroupId);
  const setProducts      = useStore((s) => s.setProducts);
  const clearAuth        = useStore((s) => s.clearAuth);

  // steps: welcome | login | register | setup | create-family | join-family
  const [step, setStep]       = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Campos de conta
  const [email, setEmail]             = useState('');
  const [name, setName]               = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Campos de grupo
  const [familyName, setFamilyName] = useState('');
  const [pin, setPin]               = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinPin, setJoinPin]       = useState('');

  const run = async (fn) => {
    setLoading(true); setError('');
    try { await fn(); }
    catch (e) {
      if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
        setError('Sem conexão com o servidor.');
      } else {
        const msg = e.response?.data?.message || firebaseErrorMsg(e);
        setError(`${msg} [${e.code || e.message || 'erro'}]`);
      }
    }
    setLoading(false);
  };

  // ── Etapa 1-A: Login com conta existente ──────────────────────────────────
  const doLogin = () => run(async () => {
    if (!email.trim()) { setError('Informe o e-mail.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }

    const { idToken } = await signInWithEmail(email, password);
    const data = await loginWithFirebaseToken(idToken);
    setAuth({ id: data.user.id, name: data.user.name, email: data.user.email }, data.token, data.familyGroupId);

    if (data.familyGroupId) {
      const [{ group }, prods] = await Promise.all([
        getFamily(data.familyGroupId),
        getProducts(data.familyGroupId),
      ]);
      setFamily(group);
      setProducts(prods);
    } else {
      setStep('setup');
    }
  });

  // ── Etapa 1-B: Criar conta nova ───────────────────────────────────────────
  const doRegister = () => run(async () => {
    if (!email.trim()) { setError('Informe o e-mail.'); return; }
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPass) { setError('As senhas não coincidem.'); return; }

    let idToken;
    try {
      ({ idToken } = await registerWithEmail(email, password));
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        ({ idToken } = await signInWithEmail(email, password));
      } else {
        throw e;
      }
    }

    const data = await loginWithFirebaseToken(idToken, name.trim());
    setAuth({ id: data.user.id, name: data.user.name, email: data.user.email }, data.token, null);

    if (data.familyGroupId) {
      const [{ group }, prods] = await Promise.all([
        getFamily(data.familyGroupId),
        getProducts(data.familyGroupId),
      ]);
      setFamily(group);
      setProducts(prods);
    } else {
      setStep('setup');
    }
  });

  // ── Etapa 2-A: Criar grupo familiar ──────────────────────────────────────
  const doCreateFamily = () => run(async () => {
    if (!familyName.trim()) { setError('Informe o nome da família.'); return; }
    if (!/^\d{4}$/.test(pin)) { setError('PIN deve ter 4 dígitos.'); return; }

    const { group } = await createFamily(familyName.trim(), pin);
    const s = useStore.getState();
    setAuth({ id: s.user.id, name: s.user.name, email: s.user.email }, s.jwt, group.id);
    setFamily(group);
    setFamilyGroupId(group.id);
  });

  // ── Etapa 2-B: Entrar com código ─────────────────────────────────────────
  const doJoinFamily = () => run(async () => {
    if (inviteCode.trim().length !== 6) { setError('Código deve ter 6 caracteres.'); return; }
    if (!/^\d{4}$/.test(joinPin)) { setError('PIN deve ter 4 dígitos.'); return; }

    const { group } = await joinFamily(inviteCode.trim().toUpperCase(), joinPin);
    const s = useStore.getState();
    setAuth({ id: s.user.id, name: s.user.name, email: s.user.email }, s.jwt, group.id);
    setFamily(group);
    setFamilyGroupId(group.id);
  });

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-logo">
          <img src="/icon.png" alt="Tem em Casa" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover' }} />
        </div>
        <div className="auth-title">Tem em Casa</div>
        <div className="auth-subtitle">Controle de estoque para toda a família</div>
        <div className="auth-brand">por Querência Labs</div>
      </div>

      <div className="auth-body">
        {error && <div className="auth-error">{error}</div>}

        {/* ── Boas-vindas ── */}
        {step === 'welcome' && (
          <>
            <div className="auth-card">
              <div className="auth-card-title">👋 Já tenho conta</div>
              <div className="auth-card-sub">Entre com seu e-mail e senha.</div>
              <button className="btn-primary" onClick={() => { setError(''); setStep('login'); }}>
                Entrar →
              </button>
            </div>
            <div className="auth-or">── primeira vez? ──</div>
            <div className="auth-card">
              <div className="auth-card-title">✨ Criar conta</div>
              <div className="auth-card-sub">Crie sua conta e configure o grupo familiar.</div>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg,#2D5FA3,#1E3A5F)' }}
                onClick={() => { setError(''); setStep('register'); }}
              >
                Criar conta →
              </button>
            </div>
          </>
        )}

        {/* ── Etapa 1-A: Login ── */}
        {step === 'login' && (
          <div className="auth-card">
            <div className="auth-card-title">👋 Entrar</div>
            <div className="auth-field">
              <label>E-mail</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="auth-field">
              <label>Senha</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <button className="btn-primary" onClick={doLogin} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
            <button className="btn-secondary" onClick={() => { setError(''); setEmail(''); setPassword(''); setStep('welcome'); }}>
              Voltar
            </button>
          </div>
        )}

        {/* ── Etapa 1-B: Criar conta ── */}
        {step === 'register' && (
          <div className="auth-card">
            <div className="auth-card-title">✨ Criar conta — Passo 1 de 2</div>
            <div className="auth-field">
              <label>Seu nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como você quer ser chamado?"
              />
            </div>
            <div className="auth-field">
              <label>E-mail</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="auth-field">
              <label>Senha</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="auth-field">
              <label>Confirmar senha</label>
              <input
                type="password" value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>
            <button className="btn-primary" onClick={doRegister} disabled={loading}>
              {loading ? 'Criando conta...' : 'Próximo →'}
            </button>
            <button className="btn-secondary" onClick={() => { setError(''); setName(''); setEmail(''); setPassword(''); setConfirmPass(''); setStep('welcome'); }}>
              Voltar
            </button>
          </div>
        )}

        {/* ── Etapa 2: Escolher grupo ── */}
        {step === 'setup' && (
          <>
            <div className="auth-card">
              <div className="auth-card-sub" style={{ textAlign: 'center', marginBottom: 4 }}>
                Passo 2 de 2 — Configure seu grupo familiar
              </div>
            </div>
            <div className="auth-card">
              <div className="auth-card-title">🏡 Criar grupo familiar</div>
              <div className="auth-card-sub">Crie um grupo e convide sua família.</div>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg,#2D5FA3,#1E3A5F)' }}
                onClick={() => { setError(''); setStep('create-family'); }}
              >
                Criar grupo →
              </button>
            </div>
            <div className="auth-card" style={{ marginTop: 10 }}>
              <div className="auth-card-title">🔗 Entrar com código</div>
              <div className="auth-card-sub">Alguém já criou um grupo? Use o código de convite.</div>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg,#60A5FA,#2563EB)' }}
                onClick={() => { setError(''); setStep('join-family'); }}
              >
                Entrar com código →
              </button>
            </div>
            <button
              className="btn-secondary"
              onClick={() => { clearAuth(); setStep('welcome'); setError(''); }}
              style={{ marginTop: 16 }}
            >
              Sair da conta
            </button>
          </>
        )}

        {/* ── Etapa 2-A: Criar grupo ── */}
        {step === 'create-family' && (
          <div className="auth-card">
            <div className="auth-card-title">🏡 Criar grupo — Passo 2 de 2</div>
            <div className="auth-field">
              <label>Nome da família</label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ex: Família Silva"
              />
            </div>
            <div className="auth-field">
              <label>PIN do grupo (4 dígitos)</label>
              <input
                className="pin-input" type="password" inputMode="numeric" maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
              <div className="auth-hint">Outros membros usarão este PIN para entrar</div>
            </div>
            <button className="btn-primary" onClick={doCreateFamily} disabled={loading}>
              {loading ? 'Criando...' : 'Criar grupo e entrar 🎉'}
            </button>
            <button className="btn-secondary" onClick={() => { setError(''); setFamilyName(''); setPin(''); setStep('setup'); }}>
              Voltar
            </button>
          </div>
        )}

        {/* ── Etapa 2-B: Entrar com código ── */}
        {step === 'join-family' && (
          <div className="auth-card">
            <div className="auth-card-title">🔗 Entrar com código — Passo 2 de 2</div>
            <div className="auth-field">
              <label>Código do grupo</label>
              <input
                className="code-input" maxLength={6} value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD12"
              />
              <div className="auth-hint">6 caracteres, peça para quem criou o grupo</div>
            </div>
            <div className="auth-field">
              <label>PIN do grupo</label>
              <input
                className="pin-input" type="password" inputMode="numeric" maxLength={4}
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
            </div>
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg,#60A5FA,#2563EB)' }}
              onClick={doJoinFamily}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar no grupo →'}
            </button>
            <button className="btn-secondary" onClick={() => { setError(''); setInviteCode(''); setJoinPin(''); setStep('setup'); }}>
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
