require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5780;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const ROTEIROS_DIR = path.join(__dirname, 'roteiros');

// LiveReload (dev only)
if (process.env.NODE_ENV !== 'production') {
  const livereload = require('livereload');
  const lrServer = livereload.createServer({
    exts: ['html', 'css', 'js'],
    delay: 150,
  });
  lrServer.watch(path.join(__dirname, 'public'));
  console.log('LiveReload ativo — monitorando public/');
}

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(express.static('public'));

// Template HTML do roteiro (prompt base)
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>Roteiro [DESTINO] — [QTD_DIAS] Dias</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;background:linear-gradient(135deg,#fff5f0 0%,#fff8e1 50%,#fffde7 100%);color:#2D2D2D;min-height:100vh}
button{border:none;background:none;cursor:pointer;font-family:inherit}
a{color:#0891b2;text-decoration:none;transition:color .2s}
a:hover{color:#0e7490}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:940;opacity:0;pointer-events:none;transition:opacity .3s}
.overlay.show{opacity:1;pointer-events:auto}
.sidebar{position:fixed;top:0;right:-280px;width:280px;height:100vh;background:#fff;z-index:950;box-shadow:-4px 0 20px rgba(0,0,0,.15);transition:right .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;overflow-y:auto}
.sidebar.open{right:0}
.sidebar-header{background:linear-gradient(135deg,#E8730C,#D4640A);color:#fff;padding:22px 20px 18px}
.sidebar-header h2{font-size:1.1rem;font-weight:700}
.sidebar-header p{font-size:.75rem;opacity:.85;margin-top:4px}
.sidebar-close{position:absolute;top:16px;right:16px;color:#fff;font-size:1.4rem;cursor:pointer;background:none;border:none}
.sidebar-nav{padding:12px 14px;flex:1}
.nav-btn{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:10px;color:#555;font-size:.88rem;font-weight:500;transition:all .2s;border:none;background:none;cursor:pointer;text-align:left}
.nav-btn:hover{background:#FFF5F0;color:#E8730C}
.nav-btn-icon{font-size:1.1rem;width:28px;text-align:center}
.header{position:sticky;top:0;z-index:100;background:linear-gradient(135deg,#E8730C,#D4640A);color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 12px rgba(232,115,12,.3);gap:10px}
.header-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.header-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;text-decoration:none;white-space:nowrap}
.header-btn:hover{background:rgba(255,255,255,.3);border-color:rgba(255,255,255,.7);color:#fff}
.header-btn.copied{background:#4CAF50;border-color:#4CAF50}
.header-content h1{font-size:1.15rem;font-weight:700;letter-spacing:.3px}
.header-content p{font-size:.72rem;opacity:.9;margin-top:2px}
.header-flag{font-size:1.2rem;margin-right:8px}
.menu-btn{color:#fff;font-size:1.5rem;padding:4px}
.main{max-width:900px;margin:0 auto;padding:16px 24px 80px}
.info-card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:24px;margin-bottom:20px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.info-label{font-size:.82rem;color:#f57c00;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:6px}
.info-value{font-size:.88rem;color:#333;font-weight:500}
.section-card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:24px;margin-bottom:20px}
.section-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.section-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;background:#f9fafb;border:2.5px solid #f9fafb;flex-shrink:0}
.section-title{font-size:1.5rem;font-weight:700;color:#1a1a1a}
.section-content p{color:#555;line-height:1.7;font-size:.85rem;margin-bottom:12px}
.section-content strong{color:#333}
.section-content ul{margin-left:20px;margin-bottom:14px}
.section-content li{color:#555;font-size:.85rem;line-height:1.5;margin-bottom:6px}
.index-item{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:all .2s}
.index-item:last-child{border-bottom:none}
.index-item:hover{padding-left:8px}
.index-icon{font-size:1.2rem;width:32px;text-align:center}
.index-text h4{font-size:.92rem;font-weight:600;color:#333}
.index-text p{font-size:.78rem;color:#999;margin-top:2px}
.orientation-cards{display:flex;flex-direction:column;gap:14px}
.orientation-item{background:#f0fdf4;border-radius:14px;padding:18px;border:1px solid #e8f5e9}
.orientation-item.apps{background:#faf5ff;border-color:#f3e8ff}
.orientation-item.clima{background:#fff7ed;border-color:#ffedd5}
.orientation-item.alertas{background:#FFF8E1;border-color:#FFE082}
.orientation-item.emergencia{background:#FFEBEE;border-color:#FFCDD2}
.orientation-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.orientation-icon{font-size:1.2rem;flex-shrink:0}
.orientation-item h3{font-size:.95rem;font-weight:700;color:#333}
.orientation-item p,.orientation-item li{font-size:.83rem;color:#555;line-height:1.6}
.emergency-grid{display:flex;flex-direction:column;gap:10px}
.emergency-card{display:flex;align-items:center;gap:14px;background:#fff;border-radius:12px;padding:14px 16px;border:1px solid #FFCDD2}
.emergency-number{font-size:1.3rem;font-weight:800;color:#c62828;min-width:50px}
.emergency-desc{font-size:.83rem;color:#555;line-height:1.4}
.emergency-card a{color:#0891b2;font-weight:600}
.place-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid #f0f0f0;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.place-card h4{font-size:.95rem;font-weight:700;color:#333;margin-bottom:8px}
.place-card p{font-size:.83rem;color:#555;line-height:1.6;margin-bottom:8px}
.place-price{display:inline-block;background:#E8F5E9;color:#2e7d32;padding:6px 12px;border-radius:8px;font-size:.82rem;font-weight:600;margin-bottom:12px}
.action-buttons{display:flex;flex-wrap:wrap;gap:8px}
.btn-action{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;border:1.5px solid #ddd;font-size:.78rem;font-weight:500;color:#555;background:#fff;transition:all .2s;text-decoration:none;cursor:pointer}
.btn-action:hover{border-color:#E8730C;color:#E8730C;background:#FFF5F0}
.day-nav{display:flex;align-items:center;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.day-nav::-webkit-scrollbar{display:none}
.day-pill{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:20px;border:1.5px solid rgba(232,115,12,.2);font-size:.82rem;font-weight:600;color:#E8730C;background:transparent;white-space:nowrap;cursor:pointer;transition:all .2s;flex-shrink:0}
.day-pill.active{background:#E8730C;color:#fff;border-color:#E8730C}
.day-controls{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:20px}
.day-arrow{width:36px;height:36px;border-radius:50%;background:#fff;border:1.5px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;transition:all .2s;color:#555}
.day-arrow:hover{border-color:#E8730C;color:#E8730C}
.day-dots{display:flex;gap:6px;align-items:center}
.day-dot{width:8px;height:8px;border-radius:50%;background:#ddd;transition:all .2s;cursor:pointer}
.day-dot.active{background:#E8730C;width:24px;border-radius:4px}
.day-content{display:none}
.day-content.active{display:block}
.day-header{display:flex;align-items:flex-start;gap:16px;margin-bottom:20px}
.day-number{width:48px;height:48px;border-radius:50%;background:#E8730C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;flex-shrink:0}
.day-title h3{font-size:1.1rem;font-weight:700;color:#1a1a1a}
.day-title p{font-size:.8rem;color:#888;margin-top:2px}
.day-highlight{background:#FFF5F0;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:.85rem;color:#E8730C;font-weight:500}
.activity-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid #f0f0f0;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.time-badge{display:inline-flex;align-items:center;gap:6px;background:#FFF5F0;color:#E8730C;padding:6px 12px;border-radius:8px;font-size:.82rem;font-weight:600;margin-bottom:10px}
.activity-card h4{font-size:.95rem;font-weight:700;color:#333;margin-bottom:8px}
.activity-card p{font-size:.83rem;color:#555;line-height:1.6;margin-bottom:10px}
.price-tag{display:inline-block;background:#E8F5E9;color:#2e7d32;padding:6px 12px;border-radius:8px;font-size:.82rem;font-weight:600;margin-bottom:12px}
.alert-tag{display:block;background:#FFF8E1;border-left:4px solid #FFA000;border-radius:0 8px 8px 0;padding:10px 14px;font-size:.82rem;color:#e65100;margin-bottom:12px;font-weight:500}
.day-total{background:#E8F5E9;border-radius:12px;padding:14px 18px;text-align:center;font-size:.92rem;font-weight:700;color:#2e7d32;margin-top:8px}
.finance-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #f0f0f0}
.finance-row:last-child{border-bottom:none}
.finance-label{font-size:.88rem;color:#555;display:flex;align-items:center;gap:8px}
.finance-value{font-size:.92rem;font-weight:700;color:#333}
.finance-total{background:#E8F5E9;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:12px}
.finance-total .finance-label{font-weight:700;color:#2e7d32;font-size:.95rem}
.finance-total .finance-value{color:#2e7d32;font-size:1.1rem}
.finance-notes{margin-top:16px}
.finance-notes p{font-size:.8rem;color:#888;line-height:1.6;margin-bottom:4px}
.reservation-card{background:#FFF8E1;border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid #FFE082}
.reservation-card h4{font-size:.95rem;font-weight:700;color:#333;margin-bottom:8px}
.reservation-card p{font-size:.83rem;color:#555;line-height:1.6;margin-bottom:6px}
.urgency-badge{display:inline-block;background:#FFEBEE;color:#c62828;padding:4px 10px;border-radius:6px;font-size:.75rem;font-weight:700;margin-bottom:8px}
.photo-card{background:#f0f9ff;border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid #e0f2fe}
.photo-card h4{font-size:.92rem;font-weight:700;color:#333;margin-bottom:8px}
.photo-card li{font-size:.83rem;color:#555;line-height:1.6;margin-bottom:6px}
.souvenir-card{background:#fdf4ff;border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid #f3e8ff}
.souvenir-card h4{font-size:.92rem;font-weight:700;color:#333;margin-bottom:8px}
.souvenir-card li{font-size:.83rem;color:#555;line-height:1.6;margin-bottom:6px}
.final-tip{background:linear-gradient(135deg,#FFF5F0,#FFF8E1);border-radius:14px;padding:20px;border:2px solid #FFE0B2;margin-bottom:20px}
.final-tip p{font-size:.88rem;color:#555;line-height:1.7}
.footer{text-align:center;padding:24px 16px;color:#aaa;font-size:.78rem;border-top:1px solid rgba(0,0,0,.06);margin-top:20px}
.back-to-top{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#E8730C;color:#fff;border:none;border-radius:24px;padding:10px 20px;font-size:.82rem;font-weight:600;cursor:pointer;z-index:90;box-shadow:0 4px 12px rgba(232,115,12,.3);display:flex;align-items:center;gap:6px;transition:all .2s}
.back-to-top:hover{background:#C45A00;transform:translateX(-50%) translateY(-2px)}
.budget-alert{background:#FFF3E0;border:2px solid #FF9800;border-radius:14px;padding:18px;margin-bottom:20px}
.budget-alert h4{color:#E65100;font-size:.95rem;margin-bottom:8px;display:flex;align-items:center;gap:8px}
.budget-alert p{color:#555;font-size:.85rem;line-height:1.6}
img.emoji{height:1.1em;width:1.1em;margin:0 .05em;vertical-align:-.15em;display:inline-block}
.city-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid #f0f0f0}
.city-card h4{font-size:1rem;font-weight:700;color:#333;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.city-card p{font-size:.83rem;color:#555;line-height:1.6;margin-bottom:8px}
.card-img{width:100%;border-radius:12px;margin-bottom:12px;object-fit:cover;max-height:200px}
@media(min-width:768px){
  .info-grid{grid-template-columns:1fr 1fr 1fr}
  .section-card{padding:32px}
  .activity-card,.place-card,.city-card,.reservation-card,.photo-card,.souvenir-card{padding:24px}
}
@media(max-width:768px){
  .index-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .index-item{padding:10px;gap:8px;border-bottom:none;background:#f9fafb;border-radius:10px}
  .index-icon{font-size:1rem;width:24px}
  .index-text h4{font-size:.78rem}
  .index-text p{display:none}
}
@media(max-width:480px){
  .header-btn span.btn-text{display:none}
  .header-btn{padding:7px 10px;font-size:.7rem}
}
@media(max-width:400px){
  .info-grid{grid-template-columns:1fr}
  .header-content h1{font-size:1rem}
  .section-title{font-size:1.2rem}
}
</style>
</head>
<body>
<div class="overlay" id="overlay" onclick="toggleMenu()"></div>
<div class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <h2>[BANDEIRA_PAIS] [DESTINO_COMPLETO]</h2>
    <p>Roteiro completo — [QTD_DIAS] dias</p>
    <button class="sidebar-close" onclick="toggleMenu()">✕</button>
  </div>
  <nav class="sidebar-nav">
    <button class="nav-btn" onclick="scrollToSection('destinos')"><span class="nav-btn-icon">🏛️</span>Sobre os Destinos</button>
    <button class="nav-btn" onclick="scrollToSection('orientacoes')"><span class="nav-btn-icon">📋</span>Orientações Gerais</button>
    <button class="nav-btn" onclick="scrollToSection('gastronomia')"><span class="nav-btn-icon">🍝</span>Gastronomia</button>
    <button class="nav-btn" onclick="scrollToSection('hospedagens')"><span class="nav-btn-icon">🏨</span>Hospedagens</button>
    <button class="nav-btn" onclick="scrollToSection('roteiro')"><span class="nav-btn-icon">📅</span>Roteiro Dia a Dia</button>
    <button class="nav-btn" onclick="scrollToSection('financeiro')"><span class="nav-btn-icon">💵</span>Resumo Financeiro</button>
    <button class="nav-btn" onclick="scrollToSection('reservas')"><span class="nav-btn-icon">📌</span>Reservas Importantes</button>
    <button class="nav-btn" onclick="scrollToSection('dicas')"><span class="nav-btn-icon">💡</span>Dicas Extras</button>
  </nav>
</div>
<div class="header">
  <div class="header-content">
    <h1><span class="header-flag">[BANDEIRA_PAIS]</span>[CIDADE1] · [CIDADE2] · [CIDADE3]</h1>
    <p>Roteiro completo — [QTD_DIAS] dias de [OBJETIVO_VIAGEM] para [PERFIL_VIAJANTES]</p>
  </div>
  <div class="header-actions">
    <button class="header-btn" onclick="copyLink()">📋 Copiar link</button>
    <a class="header-btn" href="/">✨ Novo roteiro</a>
    <button class="menu-btn" onclick="toggleMenu()">☰</button>
  </div>
</div>
<div class="main">
  <div class="info-card">
    <div class="info-grid">
      <div><div class="info-label">📅 Período</div><div class="info-value">[DATA_INICIO] – [DATA_FIM]</div></div>
      <div><div class="info-label">✈️ Destinos</div><div class="info-value">[CIDADE1] → [CIDADE2] → [CIDADE3]</div></div>
      <div><div class="info-label">👫 Viajantes</div><div class="info-value">[PERFIL_VIAJANTES]</div></div>
      <div><div class="info-label">🎯 Objetivo</div><div class="info-value">[OBJETIVO_VIAGEM]</div></div>
      <div><div class="info-label">🚌 Transporte</div><div class="info-value">[TIPO_TRANSPORTE]</div></div>
      <div><div class="info-label">🔥 Orçamento</div><div class="info-value">[ORCAMENTO_TOTAL]</div></div>
    </div>
  </div>
  <div class="section-card">
    <div class="section-header">
      <div class="section-icon">🗺️</div>
      <div class="section-title">Índice do Roteiro</div>
    </div>
    <div class="index-grid">
    <div class="index-item" onclick="goToSection('destinos')"><span class="index-icon">🏛️</span><div class="index-text"><h4>Sobre os Destinos</h4><p>História, clima e curiosidades</p></div></div>
    <div class="index-item" onclick="goToSection('orientacoes')"><span class="index-icon">📋</span><div class="index-text"><h4>Orientações Gerais</h4><p>Dinheiro, apps e alertas</p></div></div>
    <div class="index-item" onclick="goToSection('gastronomia')"><span class="index-icon">🍝</span><div class="index-text"><h4>Gastronomia</h4><p>Pratos típicos e restaurantes</p></div></div>
    <div class="index-item" onclick="goToSection('hospedagens')"><span class="index-icon">🏨</span><div class="index-text"><h4>Hospedagens</h4><p>Hotéis recomendados</p></div></div>
    <div class="index-item" onclick="goToSection('roteiro')"><span class="index-icon">📅</span><div class="index-text"><h4>Roteiro Dia a Dia</h4><p>Dias completos</p></div></div>
    <div class="index-item" onclick="goToSection('financeiro')"><span class="index-icon">💵</span><div class="index-text"><h4>Resumo Financeiro</h4><p>Custos estimados do roteiro</p></div></div>
    <div class="index-item" onclick="goToSection('reservas')"><span class="index-icon">📌</span><div class="index-text"><h4>Reservas Importantes</h4><p>O que reservar antes</p></div></div>
    <div class="index-item" onclick="goToSection('dicas')"><span class="index-icon">💡</span><div class="index-text"><h4>Dicas Extras</h4><p>Souvenirs, fotos e emergências</p></div></div>
    </div>
  </div>
  <div class="section-card" id="destinos">
    <div class="section-header"><div class="section-icon">🏛️</div><div class="section-title">Sobre os Destinos</div></div>
    <div class="section-content">
      <!-- Repetir para CADA cidade -->
      <div class="city-card">
        <h4>[BANDEIRA_PAIS] [NOME_CIDADE_1]</h4>
        <p>[3-4 frases sobre a história e contexto da cidade]</p>
        <p>🌡️ <strong>Clima em [MÊS_VIAGEM]:</strong> [temperatura média, chance de chuva, vestimenta]</p>
        <p>💡 <strong>Curiosidades:</strong> [2-3 fatos únicos]</p>
      </div>
    </div>
  </div>
  <div class="section-card" id="orientacoes">
    <div class="section-header"><div class="section-icon">📋</div><div class="section-title">Orientações Gerais</div></div>
    <div class="section-content">
      <div class="orientation-cards">
        <div class="orientation-item">
          <div class="orientation-header"><span class="orientation-icon">💱</span><h3>Dinheiro e Câmbio</h3></div>
          <p>[Moeda local, câmbio, formas de pagamento]</p>
        </div>
        <div class="orientation-item apps">
          <div class="orientation-header"><span class="orientation-icon">📱</span><h3>Apps Essenciais</h3></div>
          <ul><li>[App 1]</li><li>[App 2]</li><li>[App 3]</li><li>[App 4]</li><li>[App 5]</li><li>[App 6]</li></ul>
        </div>
        <div class="orientation-item clima">
          <div class="orientation-header"><span class="orientation-icon">🌡️</span><h3>Clima e o que Levar</h3></div>
          <p>[Previsão do clima, itens essenciais]</p>
        </div>
        <div class="orientation-item alertas">
          <div class="orientation-header"><span class="orientation-icon">⚠️</span><h3>Alertas Importantes</h3></div>
          <ul><li>[Seguro viagem]</li><li>[Segurança]</li><li>[Taxas]</li><li>[Visto]</li></ul>
        </div>
        <div class="orientation-item emergencia">
          <div class="orientation-header"><span class="orientation-icon">🚨</span><h3>Contatos de Emergência</h3></div>
          <div class="emergency-grid">
            <div class="emergency-card"><div class="emergency-number">[NUM]</div><div class="emergency-desc">— [Emergências Gerais]</div></div>
            <div class="emergency-card"><div class="emergency-number">[NUM]</div><div class="emergency-desc">— [Ambulância]</div></div>
            <div class="emergency-card"><div class="emergency-number">[NUM]</div><div class="emergency-desc">— [Polícia]</div></div>
            <div class="emergency-card"><span style="font-size:1.3rem">🇧🇷</span><div class="emergency-desc"><strong>[Consulado Brasileiro]</strong><br><a href="tel:+[NUMERO]">📞 +[NUMERO]</a></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="section-card" id="gastronomia">
    <div class="section-header"><div class="section-icon">🍝</div><div class="section-title">Gastronomia</div></div>
    <div class="section-content">
      <h3 style="font-size:1.05rem;margin-bottom:14px">[BANDEIRA_PAIS] [CIDADE] — Pratos Típicos</h3>
      <ul><li>[emoji] <strong>[Prato]</strong> — [descrição] (≈ [preço])</li></ul>
      <h3 style="font-size:1.05rem;margin:20px 0 14px">🍽️ Restaurantes Recomendados</h3>
      <div class="place-card">
        <h4>[emoji] [Restaurante]</h4>
        <p>[Especialidade, dica]</p>
        <div class="place-price">[preço para dois]</div>
        <div class="action-buttons"><a href="#" target="_blank" class="btn-action">📍 Endereço</a></div>
      </div>
    </div>
  </div>
  <div class="section-card" id="hospedagens">
    <div class="section-header"><div class="section-icon">🏨</div><div class="section-title">Hospedagens</div></div>
    <div class="section-content">
      <div class="place-card">
        <h4>🏨 [Hotel] — [CIDADE]</h4>
        <p>[Categoria, localização, incluso]</p>
        <div class="place-price">[preço/noite]</div>
        <div class="action-buttons">
          <a href="#" target="_blank" class="btn-action">📍 Ver no Mapa</a>
          <a href="#" target="_blank" class="btn-action">🌐 Site Oficial</a>
        </div>
      </div>
    </div>
  </div>
  <div class="section-card" id="roteiro">
    <div class="section-header"><div class="section-icon">📅</div><div class="section-title">Roteiro Detalhado — [QTD_DIAS] Dias</div></div>
    <div class="day-nav" id="dayNav">
      <button class="day-pill active" onclick="showDay(1)">✈️ Dia 1</button>
      <button class="day-pill" onclick="showDay(2)">[emoji] Dia 2</button>
    </div>
    <div class="day-controls">
      <button class="day-arrow" onclick="prevDay()">←</button>
      <div class="day-dots" id="dayDots">
        <span class="day-dot active" onclick="showDay(1)"></span>
        <span class="day-dot" onclick="showDay(2)"></span>
      </div>
      <button class="day-arrow" onclick="nextDay()">→</button>
    </div>
    <div class="day-content active" id="day-1">
      <div class="day-header">
        <div class="day-number">1</div>
        <div class="day-title"><h3>[Título do Dia 1]</h3><p>[Data] • [Subtítulo]</p></div>
      </div>
      <div class="day-highlight">✨ Destaque do dia: [frase resumo]</div>
      <div class="activity-card">
        <div class="time-badge">⏰ [HH:MM] – [HH:MM]</div>
        <h4>[emoji] [Atividade]</h4>
        <p>[Descrição]</p>
        <div class="price-tag">[preço]</div>
        <div class="action-buttons"><a href="#" target="_blank" class="btn-action">📍 Local</a></div>
      </div>
      <div class="day-total">💰 Total estimado Dia 1: [VALOR]</div>
    </div>
  </div>
  <div class="section-card" id="financeiro">
    <div class="section-header"><div class="section-icon">💵</div><div class="section-title">Resumo Financeiro</div></div>
    <div class="section-content">
      <div class="finance-row"><span class="finance-label">🏨 Hospedagem</span><span class="finance-value">R$ [VALOR]</span></div>
      <div class="finance-row"><span class="finance-label">✈️ Passagens Aéreas</span><span class="finance-value">R$ [VALOR]</span></div>
      <div class="finance-row"><span class="finance-label">🚄 Transporte</span><span class="finance-value">R$ [VALOR]</span></div>
      <div class="finance-row"><span class="finance-label">🍝 Alimentação</span><span class="finance-value">R$ [VALOR]</span></div>
      <div class="finance-row"><span class="finance-label">🏛️ Passeios</span><span class="finance-value">R$ [VALOR]</span></div>
      <div class="finance-total"><span class="finance-label">💰 Total Estimado</span><span class="finance-value">≈ R$ [TOTAL]</span></div>
      <div class="finance-notes"><p>📌 [Notas sobre câmbio e valores]</p></div>
    </div>
  </div>
  <div class="section-card" id="reservas">
    <div class="section-header"><div class="section-icon">📌</div><div class="section-title">Reservas Importantes</div></div>
    <div class="section-content">
      <div class="reservation-card">
        <h4>[emoji] [Atração/Serviço]</h4>
        <span class="urgency-badge">ESGOTA RÁPIDO</span>
        <p><strong>Quando reservar:</strong> [antecedência]</p>
        <p>[Dica]</p>
        <div class="action-buttons"><a href="#" target="_blank" class="btn-action">🌐 Site Oficial</a></div>
      </div>
    </div>
  </div>
  <div class="section-card" id="dicas">
    <div class="section-header"><div class="section-icon">💡</div><div class="section-title">Dicas Extras</div></div>
    <div class="section-content">
      <h3 style="font-size:1.05rem;margin-bottom:14px">🎁 O que Comprar</h3>
      <div class="souvenir-card"><h4>[CIDADE]</h4><ul><li>[Item 1]</li><li>[Item 2]</li></ul></div>
      <h3 style="font-size:1.05rem;margin-bottom:14px">📸 Dicas de Fotografia</h3>
      <div class="photo-card"><h4>[CIDADE]</h4><ul><li>[Ponto 1]</li><li>[Ponto 2]</li></ul></div>
      <h3 style="font-size:1.05rem;margin-bottom:14px">💡 Dica Final</h3>
      <div class="final-tip"><p>🌟 <strong>Dica final:</strong> [dica personalizada]</p></div>
    </div>
  </div>
  <div class="footer">
    <p>[Mensagem de despedida]</p>
    <p>Roteiro completo • [DESTINO] • [PERIODO] • Feito com 🧡</p>
  </div>
</div>
<button class="back-to-top" id="backToTop" onclick="window.scrollTo({top:0,behavior:'smooth'})"><span style="font-size:1rem">↑</span> Voltar ao topo</button>
<script src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js" crossorigin="anonymous"></script>
<script>
function toggleMenu(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
function goToSection(id){document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'})}
function scrollToSection(id){toggleMenu();setTimeout(()=>{goToSection(id)},300)}
let currentDay=1;const totalDays=[QTD_DIAS];
function showDay(n){currentDay=n;document.querySelectorAll('.day-content').forEach(d=>d.classList.remove('active'));const t=document.getElementById('day-'+n);if(t)t.classList.add('active');document.querySelectorAll('.day-pill').forEach((p,i)=>{p.classList.toggle('active',i===n-1)});document.querySelectorAll('.day-dot').forEach((d,i)=>{d.classList.toggle('active',i===n-1)});const pill=document.querySelectorAll('.day-pill')[n-1];if(pill)pill.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}
function prevDay(){if(currentDay>1)showDay(currentDay-1)}
function nextDay(){if(currentDay<totalDays)showDay(currentDay+1)}
function copyLink(){var b=document.querySelector('.header-btn');navigator.clipboard.writeText(window.location.href).then(function(){b.innerHTML='✅ Copiado!';b.classList.add('copied');setTimeout(function(){b.innerHTML='📋 Copiar link';b.classList.remove('copied')},2000)})}
if(typeof twemoji!=='undefined'){twemoji.parse(document.body,{base:'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/',folder:'svg',ext:'.svg'})}
</script>
</body>
</html>`;

function parseBudget(str) {
  // Extrai valor numérico de string como "R$ 15.000,00"
  const clean = str.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

function parseDays(dataStr) {
  // Extrai quantidade de dias de "01/07/2026 a 10/07/2026"
  const parts = dataStr.split(' a ');
  if (parts.length !== 2) return 0;
  const parseDate = (s) => {
    const [d, m, y] = s.trim().split('/');
    return new Date(y, m - 1, d);
  };
  const start = parseDate(parts[0]);
  const end = parseDate(parts[1]);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function checkBudget(data) {
  const budget = parseBudget(data.orcamento);
  const days = parseDays(data.data);
  if (!budget || !days) return null;

  // Referências mínimas por pessoa/dia por estilo (em BRL)
  const minPerDay = {
    'Mochilao': 150,
    'Economico': 250,
    'Moderado': 450,
    'Confortavel': 700,
    'Aventura': 400,
    'Luxo': 1200,
  };

  const style = data.estilo || 'Moderado';
  const perDay = minPerDay[style] || 450;

  // Estima número de viajantes (tenta extrair número)
  const travelersMatch = data.viajantes.match(/(\d+)/);
  const travelers = travelersMatch ? parseInt(travelersMatch[1], 10) : 2;

  const minBudget = perDay * days * travelers;

  if (budget < minBudget * 0.5) {
    return {
      alert: true,
      suggested: minBudget,
      days,
      travelers,
      perPersonPerDay: perDay,
    };
  }
  return null;
}

function buildPrompt(data, budgetWarning) {
  let budgetNote = '';
  if (budgetWarning) {
    budgetNote = `
ALERTA DE ORÇAMENTO: O orçamento informado parece baixo para ${budgetWarning.days} dias e ${budgetWarning.travelers} viajante(s) no estilo ${data.estilo}. O valor sugerido seria aproximadamente R$ ${budgetWarning.suggested.toLocaleString('pt-BR')}. INCLUA no HTML gerado, logo após o share-bar e antes do info-card, um div com classe "budget-alert" contendo um aviso amigável sobre o orçamento estar abaixo do recomendado, sugerindo aumentar o valor ou reduzir a duração da viagem. Mesmo assim, gere o roteiro completo tentando se adequar ao orçamento informado.`;
  }

  return `Gere um roteiro de viagem completo preenchendo o template HTML abaixo. Substitua TODOS os marcadores entre colchetes [...] por conteúdo real, verificável e detalhado. Mantenha o CSS e JavaScript exatamente como estão. Gere o HTML completo e funcional. Use informações REAIS (nomes de restaurantes, hotéis, museus, telefones e links que existem de verdade). Adapte a quantidade de dias, cidades e conteúdo conforme os dados do usuário. Cada dia deve ter 5-8 atividades detalhadas. O orçamento total deve fechar dentro do valor informado (±10%).

DADOS DO USUÁRIO:
- Destinos: ${data.destinos}
- Data: ${data.data}
- Viajantes: ${data.viajantes}
- Objetivo da viagem: ${data.objetivo}
- Atividades desejadas: ${data.atividades}
- Estilo da viagem: ${data.estilo}
- Transporte: ${data.transporte}
- Orçamento total: ${data.orcamento}
${budgetNote}

IMPORTANTE:
- Gere APENAS o código HTML completo, sem explicações antes ou depois.
- Replique TODAS as seções do template (destinos, orientações, gastronomia, hospedagens, roteiro dia a dia, financeiro, reservas, dicas).
- Crie um day-content e day-pill/day-dot para CADA dia da viagem.
- Use dados reais e verificáveis.
- Adapte o número de cidades no header conforme os destinos informados.
- O valor de totalDays no JavaScript deve ser o número correto de dias.
- Use emojis de bandeiras dos países (ex: 🇫🇷 🇮🇹 🇺🇸) nos locais indicados no template.
- Para TODOS os valores monetários (preços de restaurantes, hotéis, atividades, resumo financeiro, totais diários), exiba SEMPRE no formato: [valor em moeda local] (R$ [valor em reais]). Exemplo: "€ 25,00 (R$ 140,00)" ou "¥ 3.000 (R$ 110,00)". Use a cotação aproximada atual. No resumo financeiro, mantenha o mesmo formato dual em cada finance-value. Se o destino for no Brasil, use apenas R$.
- NÃO inclua tags <img> no HTML. As imagens serão adicionadas automaticamente pelo sistema.

TEMPLATE HTML:

${HTML_TEMPLATE}`;
}

// Extrair HTML limpo da resposta do Gemini e injetar correções
function extractHTML(text) {
  // Remove markdown code fences se existirem
  let html = text.trim();
  if (html.startsWith('```html')) {
    html = html.slice(7);
  } else if (html.startsWith('```')) {
    html = html.slice(3);
  }
  if (html.endsWith('```')) {
    html = html.slice(0, -3);
  }
  html = html.trim();

  // FIX 0: Remover imagens Unsplash que o Gemini possa ter incluído
  html = html.replace(/<img[^>]*src="[^"]*unsplash\.com[^"]*"[^>]*\/?>/gi, '');

  // FIX 1: Index-items — trocar scrollToSection por goToSection nos index-items
  // (scrollToSection abre o menu lateral, goToSection faz scroll direto)
  html = html.replace(/class="index-item"\s*onclick="scrollToSection\(/g,
    'class="index-item" onclick="goToSection(');

  // FIX 2: Garantir que goToSection existe no JS (caso Gemini não tenha incluído)
  if (!html.includes('function goToSection')) {
    html = html.replace('function scrollToSection',
      'function goToSection(id){document.getElementById(id).scrollIntoView({behavior:\'smooth\',block:\'start\'})}\nfunction scrollToSection');
  }

  // FIX 3: Injetar botões do header (copiar link + novo roteiro) se não existem
  if (!html.includes('header-actions')) {
    const headerActionsHTML = `<div class="header-actions"><button class="header-btn" onclick="copyLink()">📋 Copiar link</button><a class="header-btn" href="/">✨ Novo roteiro</a><button class="menu-btn" onclick="toggleMenu()">☰</button></div>`;
    // Substituir o menu-btn isolado pelo bloco completo
    html = html.replace(/<button class="menu-btn"[^>]*>☰<\/button>\s*<\/div>/,
      headerActionsHTML + '</div>');
  }
  // Remover share-bar antiga se existir
  html = html.replace(/<div class="share-bar">[\s\S]*?<\/div>\s*<\/div>/m, '');

  // FIX 4: Injetar copyLink se não existe
  if (!html.includes('function copyLink')) {
    const copyLinkJS = `function copyLink(){var b=document.querySelector('.header-btn');navigator.clipboard.writeText(window.location.href).then(function(){b.innerHTML='✅ Copiado!';b.classList.add('copied');setTimeout(function(){b.innerHTML='📋 Copiar link';b.classList.remove('copied')},2000)})}`;
    html = html.replace('</script>', copyLinkJS + '\n</script>');
  }

  // FIX 5: Injetar script que envolve index-items em .index-grid + imagens automáticas (desktop)
  const autoFixSnippet = `
<style>.auto-img{width:100%;border-radius:12px;margin-bottom:12px;object-fit:cover;max-height:200px}</style>
<script>
(function(){
  // Envolver index-items em .index-grid caso não exista
  if(!document.querySelector('.index-grid')){
    var items=document.querySelectorAll('.index-item');
    if(items.length){
      var grid=document.createElement('div');
      grid.className='index-grid';
      items[0].parentNode.insertBefore(grid,items[0]);
      items.forEach(function(el){grid.appendChild(el)});
    }
  }
  // Imagens automáticas via Wikipedia API
  document.querySelectorAll('.activity-card h4,.place-card h4,.city-card h4').forEach(function(h4){
      var text=h4.textContent.replace(/[^\\w\\s]/g,'').trim();
      if(text.length>2){
        var img=document.createElement('img');
        img.className='auto-img';
        img.alt=text;
        img.style.display='none';
        h4.parentElement.insertBefore(img,h4);
        fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(text))
          .then(function(r){return r.json()})
          .then(function(d){if(d.thumbnail){img.src=d.thumbnail.source;img.style.display=''}})
          .catch(function(){})
      }
    });
})();
<\/script>`;

  // FIX 6: Injetar CSS dos botões do header se não existe
  if (!html.includes('header-actions')) {
    const headerCSS = `<style>.header-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.header-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;text-decoration:none;white-space:nowrap}.header-btn:hover{background:rgba(255,255,255,.3);border-color:rgba(255,255,255,.7);color:#fff}.header-btn.copied{background:#4CAF50;border-color:#4CAF50}</style>`;
    html = html.replace('</head>', headerCSS + '\n</head>');
  }

  // ADS: Injetar Google AdSense script no <head>
  if (!html.includes('adsbygoogle')) {
    const adsenseHead = `<meta name="google-adsense-account" content="ca-pub-4364568314775092">\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4364568314775092" crossorigin="anonymous"><\/script>`;
    html = html.replace('</head>', adsenseHead + '\n</head>');
  }

  // FIX 7: Injetar Twemoji + CSS de emoji antes do </body> (bandeiras no Windows)
  const twemojiSnippet = `
<style>img.emoji{height:1.1em;width:1.1em;margin:0 .05em;vertical-align:-.15em;display:inline-block}</style>
<script src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js" crossorigin="anonymous"><\/script>
<script>if(typeof twemoji!=='undefined'){twemoji.parse(document.body,{base:'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/',folder:'svg',ext:'.svg'})}<\/script>`;

  // ADS: Snippet para injetar ads nos roteiros (entre secoes, sidebar, sticky bottom)
  const adsSnippet = `
<style>
.ad-container{max-width:728px;margin:20px auto;text-align:center;overflow:hidden}
.ad-sticky-bottom{position:fixed;bottom:0;left:0;width:100%;text-align:center;background:rgba(255,255,255,.95);box-shadow:0 -2px 10px rgba(0,0,0,.1);padding:8px 0;z-index:80}
.ad-sidebar{margin-top:20px;padding:10px;text-align:center}
.footer{padding-bottom:110px!important}
@media(max-width:768px){.ad-sticky-bottom ins{width:320px;height:50px}}
</style>
<script>
(function(){
  function createAd(slot,style){
    var d=document.createElement('div');
    d.className='ad-container';
    d.innerHTML='<ins class="adsbygoogle" style="'+(style||'display:block')+'" data-ad-client="ca-pub-4364568314775092" data-ad-slot="'+slot+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    return d;
  }
  // Ads entre secoes (a cada 2 section-cards)
  var sections=document.querySelectorAll('.section-card');
  for(var i=1;i<sections.length;i+=2){
    var ad=createAd('AD_SLOT_ROTEIRO_'+(Math.floor(i/2)+1));
    sections[i].parentNode.insertBefore(ad,sections[i].nextSibling);
    (adsbygoogle=window.adsbygoogle||[]).push({});
  }
  // Ad na sidebar
  var sidebar=document.querySelector('.sidebar-nav');
  if(sidebar){
    var sAd=document.createElement('div');
    sAd.className='ad-sidebar';
    sAd.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4364568314775092" data-ad-slot="AD_SLOT_SIDEBAR" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    sidebar.parentNode.insertBefore(sAd,sidebar.nextSibling);
    (adsbygoogle=window.adsbygoogle||[]).push({});
  }
  // Banner fixo no rodape
  var sticky=document.createElement('div');
  sticky.className='ad-sticky-bottom';
  sticky.innerHTML='<ins class="adsbygoogle" style="display:inline-block;width:728px;height:90px" data-ad-client="ca-pub-4364568314775092" data-ad-slot="AD_SLOT_STICKY"></ins>';
  document.body.appendChild(sticky);
  (adsbygoogle=window.adsbygoogle||[]).push({});
})();
<\/script>`;

  const closingSnippets = autoFixSnippet + twemojiSnippet + adsSnippet;

  if (html.includes('</body>')) {
    html = html.replace('</body>', closingSnippets + '\n</body>');
  } else {
    html += closingSnippets;
  }

  return html;
}

// SEO: Extrair destino e dias do titulo do roteiro
function parseTituloRoteiro(html) {
  const match = html.match(/<title>Roteiro\s+(.+?)\s+[—–-]\s+(\d+)\s+Dias?<\/title>/i);
  if (!match) return null;
  return { destino: match[1], dias: match[2] };
}

// Rotas

// Sitemap dinamico
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = 'https://roteirocomia.flpautomatik.com';
  let urls = `  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;

  try {
    const files = await fs.readdir(ROTEIROS_DIR);
    for (const file of files.filter(f => f.endsWith('.html'))) {
      const id = file.replace('.html', '');
      const stat = await fs.stat(path.join(ROTEIROS_DIR, file));
      const lastmod = stat.mtime.toISOString().split('T')[0];
      urls += `  <url>
    <loc>${baseUrl}/roteiro/${id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    }
  } catch {}

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;

  res.type('application/xml').send(sitemap);
});

app.post('/api/gerar-roteiro', async (req, res) => {
  try {
    const { destinos, data, viajantes, objetivo, atividades, estilo, transporte, orcamento } = req.body;

    if (!destinos || !data || !viajantes || !orcamento) {
      return res.status(400).json({ success: false, error: 'Preencha todos os campos obrigatórios.' });
    }

    const budgetWarning = checkBudget(req.body);
    const prompt = buildPrompt(req.body, budgetWarning);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawHTML = response.text;
    const html = extractHTML(rawHTML);

    const id = crypto.randomUUID().split('-')[0];
    const filePath = path.join(ROTEIROS_DIR, `${id}.html`);
    await fs.writeFile(filePath, html, 'utf-8');

    res.json({ success: true, id });
  } catch (err) {
    console.error('Erro ao gerar roteiro:', err);
    res.status(500).json({ success: false, error: 'Erro ao gerar o roteiro. Tente novamente.' });
  }
});

app.get('/roteiro/:id', async (req, res) => {
  try {
    const filePath = path.join(ROTEIROS_DIR, `${req.params.id}.html`);
    let html = await fs.readFile(filePath, 'utf-8');

    // SEO: Injetar meta tags dinamicas
    const info = parseTituloRoteiro(html);
    if (info && !html.includes('meta name="description"')) {
      const canonicalUrl = `https://roteirocomia.flpautomatik.com/roteiro/${req.params.id}`;
      const desc = `Roteiro de viagem para ${info.destino} com ${info.dias} dias. Guia completo com restaurantes, hoteis, atividades dia a dia e orcamento detalhado.`;
      const seoTags = [
        `<meta name="description" content="${desc}">`,
        `<link rel="canonical" href="${canonicalUrl}">`,
        `<meta property="og:title" content="Roteiro ${info.destino} — ${info.dias} Dias | RoteiroPro">`,
        `<meta property="og:description" content="${desc}">`,
        `<meta property="og:url" content="${canonicalUrl}">`,
        `<meta property="og:type" content="article">`,
        `<meta property="og:locale" content="pt_BR">`,
        `<meta property="og:site_name" content="RoteiroPro">`,
        `<meta name="twitter:card" content="summary">`,
        `<meta name="twitter:title" content="Roteiro ${info.destino} — ${info.dias} Dias">`,
        `<meta name="twitter:description" content="${desc}">`,
        `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAction",
          "name": `Roteiro de viagem para ${info.destino}`,
          "description": desc,
          "object": {
            "@type": "Trip",
            "name": `Viagem para ${info.destino}`,
            "itinerary": { "@type": "ItemList", "numberOfItems": parseInt(info.dias) }
          }
        })}</script>`
      ].join('\n');
      html = html.replace('</head>', seoTags + '\n</head>');
    }

    res.type('html').send(html);
  } catch {
    res.status(404).send('<h1>Roteiro nao encontrado</h1><p><a href="/">Voltar ao inicio</a></p>');
  }
});

// Iniciar servidor
async function start() {
  await fs.mkdir(ROTEIROS_DIR, { recursive: true });
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

start();
