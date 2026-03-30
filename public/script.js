// ============================================
// DATE MODE TOGGLE
// ============================================
let dateMode = 'exatas'; // 'exatas' ou 'flexivel'

function setDateMode(mode) {
  dateMode = mode;
  document.getElementById('modeExatas').classList.toggle('active', mode === 'exatas');
  document.getElementById('modeFlexivel').classList.toggle('active', mode === 'flexivel');
  document.getElementById('flexDateRow').style.display = mode === 'flexivel' ? 'grid' : 'none';
  document.getElementById('dateRangePicker').style.display = mode === 'exatas' ? 'block' : 'none';
}

// ============================================
// DATE RANGE PICKER
// ============================================
const dateDisplay = document.getElementById('dateDisplay');
const calendarDropdown = document.getElementById('calendarDropdown');
const calendarDays = document.getElementById('calendarDays');
const calMonthYear = document.getElementById('calMonthYear');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const calClear = document.getElementById('calClear');
const idaValue = document.getElementById('idaValue');
const voltaValue = document.getElementById('voltaValue');
const slotIda = document.getElementById('slotIda');
const slotVolta = document.getElementById('slotVolta');

const MONTHS_PT = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let calViewDate = new Date();
let rangeStart = null;
let rangeEnd = null;
let hoverDate = null;

// Toggle calendar
dateDisplay.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = calendarDropdown.classList.contains('open');
  calendarDropdown.classList.toggle('open');
  dateDisplay.classList.toggle('active', !isOpen);
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.date-range-picker')) {
    calendarDropdown.classList.remove('open');
    dateDisplay.classList.remove('active');
  }
});

// Navigation
calPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  calViewDate.setMonth(calViewDate.getMonth() - 1);
  renderCalendar();
});

calNext.addEventListener('click', (e) => {
  e.stopPropagation();
  calViewDate.setMonth(calViewDate.getMonth() + 1);
  renderCalendar();
});

// Clear
calClear.addEventListener('click', (e) => {
  e.stopPropagation();
  rangeStart = null;
  rangeEnd = null;
  hoverDate = null;
  updateDisplay();
  renderCalendar();
});

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(date, start, end) {
  if (!start || !end) return false;
  const t = date.getTime();
  return t > start.getTime() && t < end.getTime();
}

function formatDateBR(d) {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const daysCountEl = document.getElementById('daysCount');

function updateDisplay() {
  if (rangeStart) {
    idaValue.textContent = formatDateBR(rangeStart);
    idaValue.style.color = '#E8730C';
    slotIda.classList.add('selected');
  } else {
    idaValue.textContent = 'Selecione';
    idaValue.style.color = '';
    slotIda.classList.remove('selected');
  }
  if (rangeEnd) {
    voltaValue.textContent = formatDateBR(rangeEnd);
    voltaValue.style.color = '#E8730C';
    slotVolta.classList.add('selected');
  } else {
    voltaValue.textContent = 'Selecione';
    voltaValue.style.color = '';
    slotVolta.classList.remove('selected');
  }

  // Mostrar contagem de dias
  if (rangeStart && rangeEnd) {
    const diffMs = rangeEnd.getTime() - rangeStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    daysCountEl.textContent = `📅 ${diffDays} dia${diffDays !== 1 ? 's' : ''} de viagem`;
    daysCountEl.classList.add('show');
  } else {
    daysCountEl.classList.remove('show');
    daysCountEl.textContent = '';
  }
}

function renderCalendar() {
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  calMonthYear.textContent = `${MONTHS_PT[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  calendarDays.innerHTML = '';

  // Empty slots before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('button');
    empty.type = 'button';
    empty.className = 'cal-day empty';
    empty.disabled = true;
    calendarDays.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal-day';
    btn.textContent = d;
    btn.dataset.day = d;

    const isPast = date < today;
    if (isPast) {
      btn.classList.add('disabled');
    }

    if (sameDay(date, today)) btn.classList.add('today');

    // Range highlight
    const isStart = sameDay(date, rangeStart);
    const isEnd = sameDay(date, rangeEnd);
    const effectiveEnd = rangeEnd || hoverDate;

    if (isStart && isEnd) {
      btn.classList.add('start', 'end');
    } else if (isStart) {
      btn.classList.add('start');
      if (effectiveEnd && effectiveEnd > rangeStart) btn.classList.add('in-range');
    } else if (isEnd || (rangeStart && !rangeEnd && sameDay(date, hoverDate))) {
      btn.classList.add('end');
      if (rangeStart && date > rangeStart) btn.classList.add('in-range');
    } else if (rangeStart && effectiveEnd && isBetween(date, rangeStart, effectiveEnd)) {
      btn.classList.add('in-range');
    }

    calendarDays.appendChild(btn);
  }
}

function onDayClick(date) {
  if (!rangeStart || rangeEnd) {
    // Start fresh selection
    rangeStart = date;
    rangeEnd = null;
    hoverDate = null;
  } else {
    // Second click
    if (date < rangeStart) {
      // Clicked before start — swap
      rangeEnd = rangeStart;
      rangeStart = date;
    } else if (sameDay(date, rangeStart)) {
      // Same day — reset
      rangeStart = null;
      rangeEnd = null;
    } else {
      rangeEnd = date;
    }
    hoverDate = null;
  }
  updateDisplay();
  renderCalendar();

  // Auto-close after selecting both
  if (rangeStart && rangeEnd) {
    setTimeout(() => {
      calendarDropdown.classList.remove('open');
      dateDisplay.classList.remove('active');
    }, 300);
  }
}

// Event delegation — click and hover on calendar days
function getDayDate(el) {
  const day = parseInt(el.dataset.day, 10);
  if (!day) return null;
  const date = new Date(calViewDate.getFullYear(), calViewDate.getMonth(), day);
  date.setHours(0, 0, 0, 0);
  return date;
}

calendarDays.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.target.closest('.cal-day');
  if (!btn || btn.classList.contains('disabled') || btn.classList.contains('empty')) return;
  const date = getDayDate(btn);
  if (date) onDayClick(date);
});

calendarDays.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.cal-day');
  if (!btn || btn.classList.contains('disabled') || btn.classList.contains('empty')) return;
  if (rangeStart && !rangeEnd) {
    const date = getDayDate(btn);
    if (date && (!hoverDate || !sameDay(date, hoverDate))) {
      hoverDate = date;
      renderCalendar();
    }
  }
});

// Init calendar
renderCalendar();

// ============================================
// TWEMOJI — renderiza bandeiras no Windows
// ============================================
function parseEmojis() {
  if (typeof twemoji !== 'undefined') {
    twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
  }
}
parseEmojis();


// ============================================
// MASCARA DE MOEDA R$ + SLIDER
// ============================================
const orcamentoInput = document.getElementById('orcamento');
const budgetSlider = document.getElementById('budgetSlider');
let syncingFromSlider = false;
let syncingFromInput = false;

function formatCurrency(cents) {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyToCents(str) {
  const clean = str.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

function updateSliderFill() {
  const min = parseInt(budgetSlider.min);
  const max = parseInt(budgetSlider.max);
  const val = parseInt(budgetSlider.value);
  const pct = ((val - min) / (max - min)) * 100;
  budgetSlider.style.setProperty('--fill', pct + '%');
}

// Slider -> Input
budgetSlider.addEventListener('input', () => {
  syncingFromSlider = true;
  const val = parseInt(budgetSlider.value);
  orcamentoInput.value = formatCurrency(val * 100);
  updateSliderFill();
  syncingFromSlider = false;
});

// Input -> Slider (mascara + sync)
orcamentoInput.addEventListener('input', () => {
  let value = orcamentoInput.value.replace(/\D/g, '');
  if (!value) { orcamentoInput.value = ''; return; }

  let num = parseInt(value, 10);
  orcamentoInput.value = formatCurrency(num);

  // Sync slider
  if (!syncingFromSlider) {
    const reais = num / 100;
    const clamped = Math.min(Math.max(reais, parseInt(budgetSlider.min)), parseInt(budgetSlider.max));
    budgetSlider.value = clamped;
    updateSliderFill();
  }
});

// Init slider position and fill
budgetSlider.value = 15000;
orcamentoInput.value = formatCurrency(15000 * 100);
updateSliderFill();


// ============================================
// TOGGLE "OUTRO DESTINO"
// ============================================
const outroCheck = document.getElementById('destino-outro-check');
const outroText = document.getElementById('destino-outro-text');
outroCheck.addEventListener('change', () => {
  outroText.disabled = !outroCheck.checked;
  if (outroCheck.checked) outroText.focus();
  else outroText.value = '';
});


// ============================================
// HELPERS
// ============================================
function getCheckedValues(name) {
  const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checked).map(cb => cb.value).join(', ');
}


// ============================================
// PROGRESS STEPS
// ============================================

// Etapas intercaladas: seria, engraçada, seria, engraçada... cicla infinitamente
// Imagens Unsplash (400x500 crop) para versao desktop
const ALL_STEPS = [
  { icon: "✈️", anim: "fly",    text: "Buscando os melhores voos...",                img: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=500&fit=crop" },
  { icon: "🧳", anim: "shake",  text: "Arrumando as malas mentalmente...",            img: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=500&fit=crop" },
  { icon: "🏨", anim: "bounce", text: "Verificando hoteis e hospedagens...",           img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=500&fit=crop" },
  { icon: "🐢", anim: "float",  text: "A IA ta pensando... ela e perfeccionista...",   img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=500&fit=crop" },
  { icon: "🍽️", anim: "swing",  text: "Selecionando restaurantes incriveis...",       img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=500&fit=crop" },
  { icon: "🍕", anim: "swing",  text: "Fazendo uma pausa pra pizza...",                img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=500&fit=crop" },
  { icon: "🌤️", anim: "float",  text: "Checando clima e melhor epoca...",             img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=500&fit=crop" },
  { icon: "🤖", anim: "pulse",  text: "A IA ta caprichando no seu roteiro...",         img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=500&fit=crop" },
  { icon: "📞", anim: "shake",  text: "Pesquisando telefones importantes...",          img: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=400&h=500&fit=crop" },
  { icon: "🎒", anim: "bounce", text: "Verificando se cabe tudo na mochila...",        img: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=500&fit=crop" },
  { icon: "💰", anim: "bounce", text: "Calculando orcamento detalhado...",             img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=500&fit=crop" },
  { icon: "☕", anim: "float",  text: "Tomando um cafezinho enquanto finaliza...",     img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop" },
  { icon: "🗺️", anim: "pulse",  text: "Montando roteiro dia a dia...",                img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=500&fit=crop" },
  { icon: "🦜", anim: "bounce", text: "Consultando um papagaio local...",              img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop" },
  { icon: "📌", anim: "bounce", text: "Verificando reservas necessarias...",           img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=500&fit=crop" },
  { icon: "🍷", anim: "swing",  text: "Degustando vinhos virtualmente...",             img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=500&fit=crop" },
  { icon: "📸", anim: "pulse",  text: "Selecionando dicas de fotografia...",           img: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=500&fit=crop" },
  { icon: "🏖️", anim: "float",  text: "Ja to com saudade dessa viagem...",            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop" },
  { icon: "🎭", anim: "pulse",  text: "Pesquisando eventos culturais...",              img: "https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=400&h=500&fit=crop" },
  { icon: "🌮", anim: "swing",  text: "Agora bateu fome... voltando ao roteiro...",    img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=500&fit=crop" },
  { icon: "🗼", anim: "pulse",  text: "Conferindo os melhores pontos turisticos...",   img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=500&fit=crop" },
  { icon: "🎵", anim: "swing",  text: "Criando a playlist da viagem... brincadeira...",img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=500&fit=crop" },
  { icon: "🧭", anim: "spin",   text: "Recalculando a rota mais bonita...",            img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop" },
  { icon: "🐌", anim: "float",  text: "Devagar e sempre... qualidade leva tempo...",   img: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=500&fit=crop" },
  { icon: "🌍", anim: "spin",   text: "Dando a volta ao mundo pra encontrar o melhor...", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=500&fit=crop" },
  { icon: "💎", anim: "pulse",  text: "Polindo seu roteiro ate brilhar...",            img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=500&fit=crop" },
  { icon: "🚀", anim: "fly",    text: "Quase la! So mais um pouquinho...",             img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=500&fit=crop" },
  { icon: "🎪", anim: "bounce", text: "Procurando experiencias unicas pra voce...",    img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=500&fit=crop" },
  { icon: "🎯", anim: "bounce", text: "Ajustando cada detalhe com carinho...",         img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=500&fit=crop" },
  { icon: "✨", anim: "spin",   text: "Dando os toques finais...",                     img: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&h=500&fit=crop" },
];

const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressStep = document.getElementById('progressStep');
const progressPhase = document.getElementById('progressPhase');
const progressDone = document.getElementById('progressDone');
const stepIcon = document.getElementById('stepIcon');

let progressInterval = null;
let stepInterval = null;
let currentProgress = 0;
let apiDone = false;
let redirectUrl = null;

function showStep(step) {
  progressStep.classList.add('fade-out');
  progressStep.classList.remove('fade-in');

  stepIcon.className = 'step-icon';
  stepIcon.textContent = step.icon;
  void stepIcon.offsetWidth;
  stepIcon.classList.add('anim-' + step.anim);

  setTimeout(() => {
    progressStep.textContent = step.text;
    progressStep.classList.remove('fade-out');
    progressStep.classList.add('fade-in');
  }, 150);

  if (typeof twemoji !== 'undefined') {
    twemoji.parse(stepIcon, { folder: 'svg', ext: '.svg' });
  }
}

function startProgress() {
  currentProgress = 0;
  apiDone = false;
  redirectUrl = null;
  progressFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStep.textContent = 'Preparando sua viagem...';
  progressStep.classList.remove('fade-out', 'fade-in');
  stepIcon.className = 'step-icon anim-fly';
  stepIcon.textContent = '✈️';
  if (typeof twemoji !== 'undefined') twemoji.parse(stepIcon, { folder: 'svg', ext: '.svg' });
  progressPhase.classList.remove('hidden');
  progressDone.classList.remove('show');

  // Barra de progresso — desacelera suavemente, nunca para
  progressInterval = setInterval(() => {
    if (apiDone) {
      currentProgress += (100 - currentProgress) * 0.3;
      if (currentProgress >= 99.8) {
        currentProgress = 100;
        clearInterval(progressInterval);
        progressInterval = null;
        finishProgress();
      }
    } else {
      // Rapido ate 75% (1% a cada 200ms = 15s), depois rasteja ate 99%
      if (currentProgress < 75) {
        currentProgress += 1.0;
      } else {
        const remaining = 99 - currentProgress;
        const speed = Math.max(0.02, remaining * 0.003);
        currentProgress += speed;
      }
      currentProgress = Math.min(currentProgress, 99);
    }

    progressFill.style.width = currentProgress + '%';
    progressPercent.textContent = Math.round(currentProgress) + '%';
  }, 200);

  // Ciclo de etapas — troca a cada 3.5s, cicla infinitamente pela lista intercalada
  let stepIndex = 0;
  showStep(ALL_STEPS[0]);
  stepInterval = setInterval(() => {
    if (apiDone) return;
    stepIndex++;
    showStep(ALL_STEPS[stepIndex % ALL_STEPS.length]);
  }, 3500);
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (stepInterval) {
    clearInterval(stepInterval);
    stepInterval = null;
  }
}

function finishProgress() {
  stopProgress();
  progressFill.style.width = '100%';
  progressPercent.textContent = '100%';

  showStep({ icon: "✅", anim: "bounce", text: "Tudo pronto!" });

  setTimeout(() => {
    progressPhase.classList.add('hidden');
    progressDone.classList.add('show');
    setTimeout(() => {
      if (redirectUrl) window.location.href = redirectUrl;
    }, 1500);
  }, 600);
}

function completeProgress(url) {
  redirectUrl = url;
  apiDone = true;
  // A barra vai acelerar ate 100% no proximo tick do interval
  // Se o interval ja parou por algum motivo, finaliza direto
  if (!progressInterval) finishProgress();
}

function resetProgress() {
  stopProgress();
  currentProgress = 0;
  apiDone = false;
  redirectUrl = null;
  progressFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStep.textContent = 'Preparando sua viagem...';
  progressStep.classList.remove('fade-out', 'fade-in');
  stepIcon.className = 'step-icon anim-fly';
  stepIcon.textContent = '✈️';
  if (typeof twemoji !== 'undefined') twemoji.parse(stepIcon, { folder: 'svg', ext: '.svg' });
  progressPhase.classList.remove('hidden');
  progressDone.classList.remove('show');
}


// ============================================
// FORM SUBMIT
// ============================================
document.getElementById('roteiro-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Destinos
  let destinos = getCheckedValues('destinos');
  if (outroCheck.checked && outroText.value.trim()) {
    destinos = destinos ? destinos + ', ' + outroText.value.trim() : outroText.value.trim();
  }

  // Datas
  let data = '';
  if (dateMode === 'exatas') {
    data = (rangeStart && rangeEnd)
      ? formatDateBR(rangeStart) + ' a ' + formatDateBR(rangeEnd)
      : '';
    if (!data) {
      alert('Selecione as datas de ida e volta no calendario.');
      return;
    }
  } else {
    const dias = document.getElementById('flexDias').value;
    const estacao = document.getElementById('flexEstacao').value;
    data = dias + ' dias, na estacao: ' + estacao;
  }

  // Show loading + start progress
  const loading = document.getElementById('loading');
  resetProgress();
  loading.classList.add('active');
  startProgress();

  // Atividades e Transporte
  const atividades = getCheckedValues('atividades');
  const transporte = getCheckedValues('transporte');

  const formData = {
    destinos,
    data,
    viajantes: document.getElementById('viajantes').value,
    objetivo: document.getElementById('objetivo').value,
    atividades,
    estilo: document.getElementById('estilo').value,
    transporte,
    orcamento: 'R$ ' + orcamentoInput.value,
  };

  try {
    const response = await fetch('/api/gerar-roteiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      completeProgress(`/roteiro/${result.id}`);
    } else {
      stopProgress();
      loading.classList.remove('active');
      alert('Erro: ' + (result.error || 'Falha ao gerar roteiro.'));
    }
  } catch (err) {
    stopProgress();
    loading.classList.remove('active');
    alert('Erro de conexao. Verifique sua internet e tente novamente.');
  }
});
