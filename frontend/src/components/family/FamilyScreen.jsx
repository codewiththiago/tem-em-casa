import { useState, useEffect } from 'react';
import { updateFamilySettings, getFamilyActivity, leaveFamily } from '../../services/api';
import { openWhatsApp, copyText, buildInviteMsg } from '../../utils/whatsapp';

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');
const fmtTime = (s) =>
  s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const ACTION_ICON = {
  add_product: '➕', edit_product: '✏️', delete_product: '🗑️',
  join_group: '👤', create_group: '🎉',
};
const ACTION_LABEL = {
  add_product: 'adicionou', edit_product: 'editou', delete_product: 'removeu',
  join_group: 'entrou no grupo', create_group: 'criou o grupo',
};

export default function FamilyScreen({ family, user, onFamilyUpdate, onLogout }) {
  const [settings, setSettings] = useState({
    whatsappPhone: family.whatsappPhone || '',
    notifyExpiring: family.notifyExpiring ?? true,
    notifyLowStock: family.notifyLowStock ?? true,
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('members'); // members | activity

  useEffect(() => {
    if (tab === 'activity' && activity.length === 0) {
      getFamilyActivity(family.id)
        .then((d) => setActivity(d.logs || []))
        .catch(() => {});
    }
  }, [tab, family.id]);

  const set = (k, v) => setSettings((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      const { group } = await updateFamilySettings(family.id, settings);
      onFamilyUpdate(group);
      setSaved(true);
      setSaveError('');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError('Erro ao salvar configurações. Tente novamente.');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Sair do grupo? Você precisará do código para entrar novamente.')) return;
    try {
      await leaveFamily(family.id);
      onLogout();
    } catch {
      setLeaveError('Erro ao sair do grupo. Tente novamente.');
    }
  };

  const inviteMsg = buildInviteMsg(family.inviteCode, family.name);

  return (
    <div className="dp-screen">
      <div className="dp-hdr">
        <h1>👨‍👩‍👧 Família</h1>
        <p>{family.name} · {(family.members || []).length} membro{(family.members || []).length !== 1 ? 's' : ''}</p>
      </div>

      {/* Invite code */}
      <div style={{ padding: '14px 14px 0' }}>
        <div className="code-share-box">
          <div className="code-share-row">
            <div>
              <div className="code-share-lbl">Código do grupo</div>
              <div className="code-share-val">{family.inviteCode}</div>
            </div>
            <div>
              <div className="code-share-lbl">PIN</div>
              <div className="code-share-val">••••</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="dp-btn-wa green" style={{ flex: 1 }} onClick={() => openWhatsApp(inviteMsg, '')}>
              <span style={{ fontSize: 16 }}>💬</span> Convidar
            </button>
            <button
              className={`dp-btn-wa copy ${copiedInvite ? 'done' : ''}`}
              style={{ flex: 1 }}
              onClick={() => copyText(inviteMsg, setCopiedInvite)}
            >
              {copiedInvite ? '✓ Copiado!' : '📋 Copiar convite'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dp-tabs" style={{ padding: '10px 14px 0' }}>
        <button className={`dp-tab ${tab === 'members' ? 'on' : 'off'}`} onClick={() => setTab('members')}>👥 Membros</button>
        <button className={`dp-tab ${tab === 'activity' ? 'on' : 'off'}`} onClick={() => setTab('activity')}>📋 Histórico</button>
        <button className={`dp-tab ${tab === 'settings' ? 'on' : 'off'}`} onClick={() => setTab('settings')}>⚙️ Config</button>
      </div>

      {tab === 'members' && (
        <div className="dp-settings">
          <div className="dp-sg">
            <div className="dp-sg-label">Membros da família</div>
            {(family.members || []).map((m) => (
              <div key={m.id} className="dp-sr" style={{ paddingLeft: 16, paddingRight: 16 }}>
                <div className={`member-avatar ${m.id === user?.id ? 'you' : ''}`}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-meta">Entrou em {fmtDate(m.joinedAt)}</div>
                </div>
                {m.id === user?.id && <span className="member-you-tag">Você</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="dp-settings">
          <div className="dp-sg">
            <div className="dp-sg-label">Últimas atividades</div>
            {activity.length === 0 ? (
              <div style={{ padding: '20px 16px', color: '#9CA3AF', fontSize: 13, fontWeight: 600 }}>
                Nenhuma atividade registrada ainda.
              </div>
            ) : activity.map((log) => (
              <div key={log.id} className="dp-activity-item">
                <div className="dp-activity-dot">{ACTION_ICON[log.action] || '•'}</div>
                <div>
                  <div className="dp-activity-text">
                    <strong>{log.userName}</strong> {ACTION_LABEL[log.action] || log.action}
                    {log.productName ? ` "${log.productName}"` : ''}
                  </div>
                  <div className="dp-activity-time">{fmtTime(log.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="dp-settings">
          <div className="dp-sg">
            <div className="dp-sg-label">WhatsApp</div>
            <div className="dp-sr">
              <span className="dp-sr-icon">💬</span>
              <div className="dp-sr-info">
                <div className="dp-sr-label">Número padrão (opcional)</div>
                <div className="dp-sr-sub">Com DDI, ex: 5551999990000. Se vazio, você escolhe no WhatsApp.</div>
                <input
                  className="dp-sr-input" type="tel"
                  value={settings.whatsappPhone}
                  onChange={(e) => set('whatsappPhone', e.target.value)}
                  placeholder="5551999990000"
                />
              </div>
            </div>
          </div>

          <div className="dp-tip">
            💡 <strong>Grupos no WhatsApp:</strong> Deixe o número vazio. Ao clicar em "WhatsApp", a mensagem abre pronta para você selecionar o grupo da família.
          </div>

          <div className="dp-sg">
            <div className="dp-sg-label">Alertas push</div>
            <div className="dp-sr">
              <span className="dp-sr-icon">📉</span>
              <div className="dp-sr-info" style={{ flex: 1 }}>
                <div className="dp-sr-label">Estoque baixo</div>
                <div className="dp-sr-sub">Alerta abaixo da quantidade mínima</div>
              </div>
              <label className="dp-toggle">
                <input type="checkbox" checked={settings.notifyLowStock}
                  onChange={(e) => set('notifyLowStock', e.target.checked)} />
                <span className="dp-toggle-track" />
              </label>
            </div>
            <div className="dp-sr">
              <span className="dp-sr-icon">📅</span>
              <div className="dp-sr-info" style={{ flex: 1 }}>
                <div className="dp-sr-label">Próximo do vencimento</div>
                <div className="dp-sr-sub">Alerta quando faltam 7 dias ou menos</div>
              </div>
              <label className="dp-toggle">
                <input type="checkbox" checked={settings.notifyExpiring}
                  onChange={(e) => set('notifyExpiring', e.target.checked)} />
                <span className="dp-toggle-track" />
              </label>
            </div>
          </div>

          <button className="btn-primary" onClick={handleSave}>💾 Salvar configurações</button>
          {saved && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1E3A5F', marginTop: 10 }}>✓ Salvo!</div>}
          {saveError && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#DC2626', marginTop: 10 }}>{saveError}</div>}

          <div style={{ marginTop: 24, borderTop: '1px solid #F3F4F6', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="dp-logout-btn" style={{ background: '#F9FAFB', color: '#6B7280', borderColor: '#E5E7EB' }} onClick={onLogout}>← Sair da conta</button>
            <button className="dp-logout-btn" onClick={handleLeave}>🚪 Sair do grupo</button>
            {leaveError && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{leaveError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
