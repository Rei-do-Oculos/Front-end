# 📱 PWA - Progressive Web App

O sistema Rei do Óculos agora é um **PWA completo** e pode ser instalado como aplicativo nativo em dispositivos móveis e desktop!

## ✨ Funcionalidades PWA

### 🚀 Instalação
- **Instalável** em smartphones (iOS e Android)
- **Instalável** em desktop (Windows, macOS, Linux)
- **Funciona offline** com cache inteligente
- **Atualizações automáticas** com notificação

### 📦 Cache Strategies
- **Cache First**: Fontes Google, Tailwind CSS, imagens
- **Stale While Revalidate**: Módulos ESM
- **Auto Update**: Service Worker atualiza automaticamente

### 🎯 Shortcuts (Atalhos)
- **PDV**: Acesso rápido ao Ponto de Venda
- **Dashboard**: Acesso rápido ao Dashboard

## 🛠️ Como Usar

### Desenvolvimento
```bash
npm run dev
```
O PWA funciona em modo desenvolvimento com hot-reload.

### Build para Produção
```bash
npm run build
```
Gera os arquivos otimizados com Service Worker.

### Gerar Ícones
```bash
npm run generate-icons
```
Gera todos os tamanhos de ícones a partir do SVG.

## 📱 Como Instalar

### No Mobile (Android)
1. Abra o sistema no navegador Chrome
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação

### No Mobile (iOS)
1. Abra o sistema no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme a instalação

### No Desktop
1. Abra o sistema no navegador
2. Procure pelo ícone de instalação na barra de endereço
3. Clique em "Instalar"
4. Confirme a instalação

## 🔄 Atualizações

O sistema verifica atualizações automaticamente a cada hora. Quando uma nova versão estiver disponível, um prompt aparecerá na tela permitindo atualizar imediatamente.

## 📋 Requisitos

- Navegador moderno com suporte a Service Workers
- HTTPS (obrigatório em produção)
- Conexão inicial para primeiro carregamento

## 🎨 Personalização

### Ícones
Os ícones estão em `public/icons/`. Para personalizar:
1. Edite `public/icons/icon.svg`
2. Execute `npm run generate-icons`
3. Rebuild o projeto

### Manifest
Edite `public/manifest.json` para personalizar:
- Nome do app
- Cores do tema
- Orientação
- Shortcuts

## 🔍 Testando o PWA

### Chrome DevTools
1. Abra DevTools (F12)
2. Vá em "Application" > "Service Workers"
3. Verifique o status do Service Worker
4. Teste o modo offline

### Lighthouse
1. Abra DevTools (F12)
2. Vá em "Lighthouse"
3. Selecione "Progressive Web App"
4. Execute a auditoria

## 📝 Notas

- O Service Worker é gerado automaticamente pelo `vite-plugin-pwa`
- Cache é limpo automaticamente quando necessário
- Atualizações são aplicadas sem perder dados do usuário
- Funciona em todos os navegadores modernos
