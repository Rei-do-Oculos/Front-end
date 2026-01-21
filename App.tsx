
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ClientList } from './pages/Clients/ClientList';
import { ClientForm } from './pages/Clients/ClientForm';
import { StockList } from './pages/Stock/StockList';
import { OrderForm } from './pages/Orders/OrderForm';
import { SupplierList } from './pages/Suppliers/SupplierList';
import { SupplierForm } from './pages/Suppliers/SupplierForm';
import { POS } from './pages/Sales/POS';
import { CashFlow } from './pages/Finance/CashFlow';
import { Chat } from './pages/Chat';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="mb-8">
      <h1 className="text-4xl font-black text-slate-950 tracking-tight">{title}</h1>
      <p className="text-gray-500 font-medium mt-1">Módulo em desenvolvimento para a nova versão.</p>
    </div>
    <div className="bg-white p-24 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-300">
       <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
       </div>
       <p className="text-lg font-bold italic tracking-tight">Módulo em Atualização</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout onLogout={() => {}}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pdv" element={<POS />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/clientes" element={<ClientList />} />
          <Route path="/clientes/novo" element={<ClientForm />} />
          <Route path="/estoque" element={<StockList />} />
          <Route path="/fornecedores" element={<SupplierList />} />
          <Route path="/fornecedores/novo" element={<SupplierForm />} />
          <Route path="/financeiro" element={<CashFlow />} />
          <Route path="/pedidos" element={<PlaceholderPage title="Ordens de Serviço" />} />
          <Route path="/pedidos/novo" element={<OrderForm />} />
          <Route path="/lixeira" element={<PlaceholderPage title="Lixeira" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
