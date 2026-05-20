import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from './store/useStore';
import { getFamily, getProducts, createProduct, updateProduct, deleteProduct } from './services/api';
import { initNotifications } from './services/notifications';
import { buildShoppingList } from './utils/alerts';
import { getAlerts } from './utils/alerts';

import { signOutUser } from './services/firebase';
import LoginScreen from './components/auth/LoginScreen';
import HomeScreen from './components/home/HomeScreen';
import StockScreen from './components/stock/StockScreen';
import ProductModal from './components/stock/ProductModal';
import ListaScreen from './components/shopping/ListaScreen';
import FamilyScreen from './components/family/FamilyScreen';
import StatisticsScreen from './components/stats/StatisticsScreen';
import BottomNav from './components/shared/BottomNav';

import './styles/global.css';

export default function App() {
  const { user, familyGroupId, family, products, setFamily, setProducts, upsertProduct, removeProduct, clearAuth, setSyncing, syncing } = useStore();

  const [screen, setScreen] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    (async () => {
      if (familyGroupId && user) {
        try {
          const [{ group }, prods] = await Promise.all([
            getFamily(familyGroupId),
            getProducts(familyGroupId),
          ]);
          setFamily(group);
          setProducts(prods);
          await initNotifications();
        } catch (err) {
          console.error('Initial load failed:', err);
        }
      }
      setLoaded(true);
    })();
  }, []);

  // Polling — sync every 60s when tab is visible
  useEffect(() => {
    if (!familyGroupId) return;
    const sync = async () => {
      if (document.hidden) return;
      try {
        const [{ group }, prods] = await Promise.all([
          getFamily(familyGroupId),
          getProducts(familyGroupId),
        ]);
        setFamily(group);
        setProducts(prods);
      } catch (err) {
        console.error('Sync failed:', err);
      }
    };
    const interval = setInterval(sync, 60000);
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', sync); };
  }, [familyGroupId]);

  const handleSync = useCallback(async () => {
    if (!familyGroupId) return;
    setSyncing(true);
    try {
      const [{ group }, prods] = await Promise.all([
        getFamily(familyGroupId),
        getProducts(familyGroupId),
      ]);
      setFamily(group);
      setProducts(prods);
    } catch (err) {
      console.error('Manual sync failed:', err);
    }
    setTimeout(() => setSyncing(false), 700);
  }, [familyGroupId]);

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        const updated = await updateProduct(familyGroupId, editingProduct.id, formData);
        upsertProduct(updated);
      } else {
        const created = await createProduct(familyGroupId, formData);
        upsertProduct(created);
      }
      setShowModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Save product failed:', err);
      showError('Erro ao salvar produto. Verifique sua conexão e tente novamente.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(familyGroupId, id);
      removeProduct(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete product failed:', err);
      showError('Erro ao remover produto. Tente novamente.');
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (p) => { setEditingProduct(p); setShowModal(true); };
  const handleAdd  = () => { setEditingProduct(null); setShowModal(true); };

  const handleFamilyUpdate = (group) => setFamily(group);
  const handleLogout = () => { signOutUser().catch(() => {}); clearAuth(); };

  const allAlerts = useMemo(
    () => products.flatMap((p) => getAlerts(p).map((a) => ({ ...a, product: p }))),
    [products]
  );
  const shopList = useMemo(() => buildShoppingList(products), [products]);

  const [errorMsg, setErrorMsg] = useState('');
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  if (!loaded) {
    return (
      <div className="dp-loading">
        <div className="dp-loading-spinner" />
        <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2A7A4F' }}>🏡 Tem em Casa</span>
      </div>
    );
  }

  if (!user || !familyGroupId || !family) {
    return <LoginScreen />;
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          family={family}
          user={user}
          products={products}
          onEdit={handleEdit}
          onNavigate={setScreen}
          onLogout={handleLogout}
        />
      )}
      {screen === 'stock' && (
        <StockScreen
          products={products}
          onEdit={handleEdit}
          onDelete={setDeleteConfirm}
        />
      )}
      {screen === 'lista' && (
        <ListaScreen family={family} products={products} />
      )}
      {screen === 'family' && (
        <FamilyScreen
          family={family}
          user={user}
          onFamilyUpdate={handleFamilyUpdate}
          onLogout={handleLogout}
        />
      )}
      {screen === 'stats' && (
        <StatisticsScreen products={products} />
      )}

      <BottomNav
        screen={screen}
        setScreen={setScreen}
        alertCount={allAlerts.length}
        shopCount={shopList.length}
        onAdd={handleAdd}
      />

      {showModal && (
        <ProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
        />
      )}

      {errorMsg && (
        <div style={{
          position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9999,
          background: '#DC2626', color: 'white', borderRadius: 12,
          padding: '12px 16px', fontFamily: 'Nunito, sans-serif',
          fontWeight: 700, fontSize: 14, textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}>
          {errorMsg}
        </div>
      )}

      {deleteConfirm && (
        <div className="dp-overlay center" onClick={() => setDeleteConfirm(null)}>
          <div className="dp-confirm" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3>Remover produto?</h3>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="dp-btn-row">
              <button className="dp-btn-s" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="dp-btn-d" onClick={() => handleDelete(deleteConfirm)}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
