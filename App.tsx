import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ClientList } from './pages/Clients/ClientList';
import { ClientForm } from './pages/Clients/ClientForm';
import { ClientHistory } from './pages/Clients/ClientHistory';
import { StockList } from './pages/Stock/StockList';
import { FramesSoldReport } from './pages/Stock/FramesSoldReport';
import { OrderForm } from './pages/Orders/OrderForm';
import { OrderList } from './pages/Orders/OrderList';
import { LabOrders } from './pages/Orders/LabOrders';
import { StoreList } from './pages/Stores/StoreList';
import { StoreForm } from './pages/Stores/StoreForm';
import { TrashList } from './pages/Trash/TrashList';
import { TrashDetail } from './pages/Trash/TrashDetail';
import { AuditList } from './pages/Audit/AuditList';
import { POS } from './pages/Sales/POS';
import { CashFlow } from './pages/Finance/CashFlow';
import { Inadimplencias } from './pages/Finance/Inadimplencias';
import { ExpenseList } from './pages/Finance/ExpenseList';
import { ExpenseForm } from './pages/Finance/ExpenseForm';
import { InvoiceList } from './pages/Finance/InvoiceList';
import { InvoiceDetail } from './pages/Finance/InvoiceDetail';
import { Permissions } from './pages/Permissions/Permissions';
import { ProfileForm } from './pages/Permissions/ProfileForm';
import { Users } from './pages/Users/Users';
import { UserForm } from './pages/Users/UserForm';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { BrandList } from './pages/Brands/BrandList';
import { BrandForm } from './pages/Brands/BrandForm';
import { SupplierList } from './pages/Suppliers/SupplierList';
import { SupplierForm } from './pages/Suppliers/SupplierForm';
import { LensList } from './pages/Lenses/LensList';
import { FrameTypeList } from './pages/FrameTypes/FrameTypeList';
import { FrameTypeForm } from './pages/FrameTypes/FrameTypeForm';
import { FrameList } from './pages/Frames/FrameList';
import { FrameForm } from './pages/Frames/FrameForm';
import { StoreFrameList } from './pages/StoreFrames/StoreFrameList';
import { LaboratoryList } from './pages/Laboratories/LaboratoryList';
import { LaboratoryForm } from './pages/Laboratories/LaboratoryForm';
import { LaboratoryDetail } from './pages/Laboratories/LaboratoryDetail';
import { LaboratoryLensList } from './pages/LaboratoryLenses/LaboratoryLensList';
import { LaboratoryLensForm } from './pages/LaboratoryLenses/LaboratoryLensForm';
import { ServiceOrderList, ServiceOrderForm, ServiceOrderLabList, ServiceOrderChangePayment, ServiceOrderSheetPage } from './pages/ServiceOrders';
import { Chat } from './pages/Chat';
import { Login } from './pages/Login';
import { NotFound404 } from './pages/NotFound404';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { useAuth } from './services/hooks/useAuth';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StoreSelector } from './components/StoreSelector';
import { NotificationProvider } from './contexts/NotificationContext';

/** Redirects para compatibilidade com URLs antigas em português */
const InvoiceIdRedirect = () => { const { id } = useParams(); return <Navigate to={id ? `/invoices/${id}` : '/invoices'} replace />; };
const OrderEditRedirect = () => { const { id } = useParams(); return <Navigate to={id ? `/orders/${id}/edit` : '/orders'} replace />; };
const SupplierEditRedirect = () => { const { id } = useParams(); return <Navigate to={id ? `/suppliers/${id}/edit` : '/suppliers'} replace />; };

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-950 tracking-tight">{title}</h1>
      <p className="text-slate-500 font-medium mt-1">Módulo em desenvolvimento para a nova versão.</p>
    </div>
    <div className="bg-white p-24 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-300">
       <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
       </div>
       <p className="text-base font-semibold italic tracking-tight text-slate-400">Módulo em Atualização</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  const handleLogin = () => {
    // Não recarrega mais - o AuthContext já atualizou o user após login
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div
          className="w-12 h-12 border-4 border-slate-100 rounded-full animate-spin"
          style={{ borderTopColor: 'var(--store-color, #dc2626)' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <BrowserRouter>
          <StoreProvider>
            <StoreSelectorWrapper onLogout={handleLogout} />
          </StoreProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

const StoreSelectorWrapper: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user } = useAuth();
  const { availableStores, selectedStore } = useStore();
  const [showStoreSelector, setShowStoreSelector] = React.useState(false);
  const [hasSelectedStore, setHasSelectedStore] = React.useState(false);

  // Verificar se precisa mostrar o seletor de loja
  React.useEffect(() => {
    if (!user) {
      setShowStoreSelector(false);
      setHasSelectedStore(false);
      return;
    }

    // Se já tem uma loja selecionada ou já selecionou antes, não mostrar
    if (selectedStore || hasSelectedStore) {
      setShowStoreSelector(false);
      return;
    }

    // Garantir que roles seja um array
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    // Verificar se tem múltiplas lojas ou é superadmin
    const isAdmin = userRoles.some((r: any) => {
      const roleName = typeof r === 'object' && r !== null ? r.name : r;
      return roleName === 'superadmin';
    });
    const hasMultipleStores = availableStores.length > 1;

    // Mostrar seletor se:
    // 1. É admin e tem lojas disponíveis, OU
    // 2. Tem múltiplas lojas
    if ((isAdmin && availableStores.length > 0) || hasMultipleStores) {
      setShowStoreSelector(true);
    } else {
      // Se não precisa selecionar, marcar como já selecionado
      setHasSelectedStore(true);
    }
  }, [user, availableStores, selectedStore, hasSelectedStore]);

  const handleStoreSelected = () => {
    setShowStoreSelector(false);
    setHasSelectedStore(true);
  };

  if (showStoreSelector) {
    return <StoreSelector onStoreSelected={handleStoreSelected} />;
  }

  return (
    <Layout onLogout={onLogout}>
      <PWAUpdatePrompt />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pdv" element={<ProtectedRoute><POS /></ProtectedRoute>} />
        <Route path="/stores" element={<ProtectedRoute><StoreList /></ProtectedRoute>} />
        <Route path="/stores/create" element={<ProtectedRoute><StoreForm /></ProtectedRoute>} />
        <Route path="/stores/:id/edit" element={<ProtectedRoute><StoreForm /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/clients/create" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientHistory /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><StockList /></ProtectedRoute>} />
        <Route path="/stock/reports" element={<ProtectedRoute><FramesSoldReport /></ProtectedRoute>} />
        <Route path="/lenses" element={<ProtectedRoute><LensList /></ProtectedRoute>} />
        <Route path="/frame-types" element={<ProtectedRoute><FrameTypeList /></ProtectedRoute>} />
        <Route path="/frame-types/create" element={<ProtectedRoute><FrameTypeForm /></ProtectedRoute>} />
        <Route path="/frame-types/:id/edit" element={<ProtectedRoute><FrameTypeForm /></ProtectedRoute>} />
        <Route path="/frames" element={<ProtectedRoute><FrameList /></ProtectedRoute>} />
        <Route path="/frames/create" element={<ProtectedRoute><FrameForm /></ProtectedRoute>} />
        <Route path="/frames/:id/edit" element={<ProtectedRoute><FrameForm /></ProtectedRoute>} />
        <Route path="/transfers" element={<ProtectedRoute><StoreFrameList /></ProtectedRoute>} />
        <Route path="/laboratories" element={<ProtectedRoute><LaboratoryList /></ProtectedRoute>} />
        <Route path="/laboratories/create" element={<ProtectedRoute><LaboratoryForm /></ProtectedRoute>} />
        <Route path="/laboratories/:id" element={<ProtectedRoute><LaboratoryDetail /></ProtectedRoute>} />
        <Route path="/laboratories/:id/edit" element={<ProtectedRoute><LaboratoryForm /></ProtectedRoute>} />
        <Route path="/laboratory-lenses" element={<ProtectedRoute><LaboratoryLensList /></ProtectedRoute>} />
        <Route path="/laboratory-lenses/create" element={<ProtectedRoute><LaboratoryLensForm /></ProtectedRoute>} />
        <Route path="/laboratory-lenses/:id/edit" element={<ProtectedRoute><LaboratoryLensForm /></ProtectedRoute>} />
        <Route path="/service-orders" element={<ProtectedRoute><ServiceOrderList /></ProtectedRoute>} />
        <Route path="/service-orders/create" element={<ProtectedRoute><ServiceOrderForm /></ProtectedRoute>} />
        <Route path="/service-orders/lab" element={<ProtectedRoute><ServiceOrderLabList /></ProtectedRoute>} />
        <Route path="/service-orders/:id/change-payment" element={<ProtectedRoute><ServiceOrderChangePayment /></ProtectedRoute>} />
        <Route path="/service-orders/:id/sheet" element={<ProtectedRoute><ServiceOrderSheetPage /></ProtectedRoute>} />
        <Route path="/service-orders/:id" element={<ProtectedRoute><ServiceOrderForm /></ProtectedRoute>} />
        <Route path="/service-orders/:id/edit" element={<ProtectedRoute><ServiceOrderForm /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
        <Route path="/finance/overdue" element={<ProtectedRoute><Inadimplencias /></ProtectedRoute>} />
        <Route path="/finance/expenses" element={<ProtectedRoute><ExpenseList /></ProtectedRoute>} />
        <Route path="/finance/expenses/create" element={<ProtectedRoute><ExpenseForm /></ProtectedRoute>} />
        <Route path="/finance/expenses/:id/edit" element={<ProtectedRoute><ExpenseForm /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="/orders/lab" element={<ProtectedRoute><LabOrders /></ProtectedRoute>} />
        <Route path="/orders/create" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />
        <Route path="/orders/:id/edit" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />
        {/* Redirects: rotas antigas em português → inglês */}
        <Route path="/notas-fiscais" element={<Navigate to="/invoices" replace />} />
        <Route path="/notas-fiscais/:id" element={<InvoiceIdRedirect />} />
        <Route path="/vendedores" element={<Navigate to="/" replace />} />
        <Route path="/vendedores/create" element={<Navigate to="/" replace />} />
        <Route path="/vendedores/:id/editar" element={<Navigate to="/" replace />} />
        <Route path="/vendedores/:id" element={<Navigate to="/" replace />} />
        <Route path="/estoque" element={<Navigate to="/stock" replace />} />
        <Route path="/estoque/relatorios" element={<Navigate to="/stock/reports" replace />} />
        <Route path="/transferencias" element={<Navigate to="/transfers" replace />} />
        <Route path="/pedidos" element={<Navigate to="/orders" replace />} />
        <Route path="/pedidos/laboratorio" element={<Navigate to="/orders/lab" replace />} />
        <Route path="/pedidos/create" element={<Navigate to="/orders/create" replace />} />
        <Route path="/pedidos/:id/editar" element={<OrderEditRedirect />} />
        <Route path="/suppliers" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
        <Route path="/suppliers/create" element={<ProtectedRoute><SupplierForm /></ProtectedRoute>} />
        <Route path="/suppliers/:id/edit" element={<ProtectedRoute><SupplierForm /></ProtectedRoute>} />
        <Route path="/fornecedores" element={<Navigate to="/suppliers" replace />} />
        <Route path="/fornecedores/create" element={<Navigate to="/suppliers/create" replace />} />
        <Route path="/fornecedores/:id/editar" element={<SupplierEditRedirect />} />
        <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
        <Route path="/profiles/create" element={<ProtectedRoute><ProfileForm /></ProtectedRoute>} />
        <Route path="/profiles/:id/edit" element={<ProtectedRoute><ProfileForm /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/users/create" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/users/:id/edit" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><AuditList /></ProtectedRoute>} />
        <Route path="/trash" element={<ProtectedRoute><TrashList /></ProtectedRoute>} />
        <Route path="/trash/item/:model/:id" element={<ProtectedRoute><TrashDetail /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><NotFound404 /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
};

export default App;
