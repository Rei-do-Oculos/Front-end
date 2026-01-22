
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ClientList } from './pages/Clients/ClientList';
import { ClientForm } from './pages/Clients/ClientForm';
import { StockList } from './pages/Stock/StockList';
import { OrderForm } from './pages/Orders/OrderForm';
import { OrderList } from './pages/Orders/OrderList';
import { LabOrders } from './pages/Orders/LabOrders';
import { SupplierList } from './pages/Suppliers/SupplierList';
import { SupplierForm } from './pages/Suppliers/SupplierForm';
import { StoreList } from './pages/Stores/StoreList';
import { StoreForm } from './pages/Stores/StoreForm';
import { StoreDetail } from './pages/Stores/StoreDetail';
import { AuditList } from './pages/Audit/AuditList';
import { POS } from './pages/Sales/POS';
import { CashFlow } from './pages/Finance/CashFlow';
import { Chat } from './pages/Chat';
import { Login } from './pages/Login';

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pdv" element={<POS />} />
          <Route path="/lojas" element={<StoreList />} />
          <Route path="/lojas/novo" element={<StoreForm />} />
          <Route path="/lojas/:id" element={<StoreDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/clientes" element={<ClientList />} />
          <Route path="/clientes/novo" element={<ClientForm />} />
          <Route path="/estoque" element={<StockList />} />
          <Route path="/fornecedores" element={<SupplierList />} />
          <Route path="/fornecedores/novo" element={<SupplierForm />} />
          <Route path="/financeiro" element={<CashFlow />} />
          <Route path="/pedidos" element={<OrderList />} />
          <Route path="/pedidos/laboratorio" element={<LabOrders />} />
          <Route path="/pedidos/novo" element={<OrderForm />} />
          <Route path="/auditoria" element={<AuditList />} />
          <Route path="/lixeira" element={<PlaceholderPage title="Lixeira" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
