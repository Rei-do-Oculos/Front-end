
import React, { useState } from 'react';
import { 
  Send, 
  Search, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Store, 
  Circle, 
  Image as ImageIcon,
  CheckCheck,
  User
} from 'lucide-react';
import { Card, Button, Input } from '../components/Common';

interface Message {
  id: string;
  senderName: string;
  senderStore: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface UnitChat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const mockUnits: UnitChat[] = [
  { id: 'all', name: 'Geral - Todas as Lojas', lastMessage: 'Nova campanha de descontos...', time: '10:25', unread: 2, online: true },
  { id: '1', name: 'Maringá Centro', lastMessage: 'Tem a armação Rayban 3447 aí?', time: '09:15', unread: 0, online: true },
  { id: '2', name: 'Londrina Shopping', lastMessage: 'Transferência enviada!', time: 'Ontem', unread: 0, online: false },
  { id: '3', name: 'Curitiba Batel', lastMessage: 'Ok, vou verificar.', time: 'Ontem', unread: 0, online: true },
];

const mockMessages: Message[] = [
  { 
    id: '1', 
    senderName: 'João Silva', 
    senderStore: 'Maringá Centro', 
    text: 'Bom dia pessoal! Alguém tem a armação Ray-Ban 3447 cor dourada em estoque?', 
    time: '09:10', 
    isMe: false 
  },
  { 
    id: '2', 
    senderName: 'Rodrigo Paduin', 
    senderStore: 'Londrina Shopping', 
    text: 'Bom dia! Deixa eu verificar aqui no sistema rapidinho.', 
    time: '09:12', 
    isMe: true 
  },
  { 
    id: '3', 
    senderName: 'Rodrigo Paduin', 
    senderStore: 'Londrina Shopping', 
    text: 'Temos uma unidade aqui na Londrina Shopping. Quer que eu reserve para transferência?', 
    time: '09:15', 
    isMe: true 
  },
  { 
    id: '4', 
    senderName: 'Ana Paula', 
    senderStore: 'Maringá Centro', 
    text: 'Por favor! O cliente está aqui na loja aguardando a confirmação.', 
    time: '09:16', 
    isMe: false 
  },
];

export const Chat: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<string>('1');
  const [messageText, setMessageText] = useState('');

  const currentStore = mockUnits.find(u => u.id === selectedUnit);

  return (
    <div className="flex h-[calc(100vh-160px)] gap-6 animate-in fade-in duration-700">
      {/* Sidebar de Unidades */}
      <div className="w-80 flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-lg font-bold text-slate-950 tracking-tight mb-4">Comunicação</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar loja ou grupo..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500/10 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {mockUnits.map((unit) => (
            <div 
              key={unit.id}
              onClick={() => setSelectedUnit(unit.id)}
              className={`flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4 ${
                selectedUnit === unit.id 
                  ? 'bg-red-50/50 border-red-600' 
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  unit.id === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {unit.id === 'all' ? <Users size={20} /> : <Store size={20} />}
                </div>
                {unit.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">{unit.name}</h3>
                  <span className="text-[9px] font-semibold text-slate-400">{unit.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 truncate font-medium">{unit.lastMessage}</p>
                  {unit.unread > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {unit.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Janela de Mensagens */}
      <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header do Chat */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600">
              {selectedUnit === 'all' ? <Users size={20} /> : <Store size={20} />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-[0.2em]">
                {currentStore?.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {selectedUnit === 'all' ? '12 Membros Ativos' : 'Loja Online'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
              <Search size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
          <div className="text-center">
             <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] shadow-sm">
                Hoje, 21 de Janeiro
             </span>
          </div>

          {mockMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] space-y-1.5`}>
                <div className={`flex items-center gap-2 mb-1 px-1 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                   <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{msg.senderName}</span>
                   <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">• {msg.senderStore}</span>
                </div>
                
                <div className={`p-4 rounded-[1.25rem] shadow-sm relative group ${
                  msg.isMe 
                    ? 'bg-red-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-2 ${msg.isMe ? 'text-red-100' : 'text-slate-400'}`}>
                    <span className="text-[9px] font-bold uppercase">{msg.time}</span>
                    {msg.isMe && <CheckCheck size={12} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input de Mensagem */}
        <div className="p-6 bg-white border-t border-slate-50">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
               <button className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Anexar arquivo">
                 <Paperclip size={20} />
               </button>
               <button className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Enviar imagem">
                 <ImageIcon size={20} />
               </button>
             </div>
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Mensagem para ${currentStore?.name}...`} 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-red-500/5 transition-all outline-none placeholder:text-slate-400"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-600 transition-colors">
                  <Smile size={20} />
                </button>
             </div>
             <button className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all">
                <Send size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple icon for general groups if needed
const Users = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
