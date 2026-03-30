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

// Etapas principais (mostradas em ordem enquanto barra sobe ate ~88%)
const MAIN_STEPS = [
  { icon: "✈️", anim: "fly",    text: "Buscando os melhores voos..." },
  { icon: "🏨", anim: "bounce", text: "Verificando hoteis e hospedagens..." },
  { icon: "🍽️", anim: "swing",  text: "Selecionando restaurantes incriveis..." },
  { icon: "🌤️", anim: "float",  text: "Checando clima e melhor epoca..." },
  { icon: "📞", anim: "shake",  text: "Pesquisando telefones importantes..." },
  { icon: "💰", anim: "bounce", text: "Calculando orcamento detalhado..." },
  { icon: "🗺️", anim: "pulse",  text: "Montando roteiro dia a dia..." },
  { icon: "📌", anim: "bounce", text: "Verificando reservas necessarias..." },
  { icon: "📸", anim: "pulse",  text: "Selecionando dicas de fotografia..." },
  { icon: "✨", anim: "spin",   text: "Dando os toques finais..." },
];

// Etapas extras — ciclam infinitamente apos as principais (pra nunca parecer travado)
const EXTRA_STEPS = [
  { icon: "🧳", anim: "shake",  text: "Arrumando as malas mentalmente..." },
  { icon: "🐢", anim: "float",  text: "A IA ta pensando... ela e perfeccionista..." },
  { icon: "🍕", anim: "swing",  text: "Fazendo uma pausa pra pizza..." },
  { icon: "🤖", anim: "pulse",  text: "A IA ta caprichando no seu roteiro..." },
  { icon: "🎒", anim: "bounce", text: "Verificando se cabe tudo na mochila..." },
  { icon: "☕", anim: "float",  text: "Tomando um cafezinho enquanto finaliza..." },
  { icon: "🗼", anim: "pulse",  text: "Conferindo os melhores pontos turisticos..." },
  { icon: "🧭", anim: "spin",   text: "Recalculando a rota mais bonita..." },
  { icon: "🎵", anim: "swing",  text: "Criando a playlist da viagem... brincadeira..." },
  { icon: "🌍", anim: "spin",   text: "Dando a volta ao mundo pra encontrar o melhor..." },
  { icon: "🦜", anim: "bounce", text: "Consultando um papagaio local..." },
  { icon: "🍷", anim: "swing",  text: "Degustando vinhos virtualmente..." },
  { icon: "🏖️", anim: "float",  text: "Ja to com saudade dessa viagem..." },
  { icon: "🎭", anim: "pulse",  text: "Pesquisando eventos culturais..." },
  { icon: "🚀", anim: "fly",    text: "Quase la! So mais um pouquinho..." },
  { icon: "🎯", anim: "bounce", text: "Ajustando cada detalhe com carinho..." },
  { icon: "🌮", anim: "swing",  text: "Agora bateu fome... voltando ao roteiro..." },
  { icon: "🐌", anim: "float",  text: "Devagar e sempre... qualidade leva tempo..." },
  { icon: "💎", anim: "pulse",  text: "Polindo seu roteiro ate brilhar..." },
  { icon: "🎪", anim: "bounce", text: "Procurando experiencias unicas pra voce..." },
];

const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressStep = document.getElementById('progressStep');
const progressPhase = document.getElementById('progressPhase');
const progressDone = document.getElementById('progressDone');
const stepIcon = document.getElementById('stepIcon');

let progressInterval = null;
let stepCycleInterval = null;
let currentProgress = 0;
let apiDone = false;
let redirectUrl = null;

function showStep(step) {
  // Fade out text
  progressStep.classList.add('fade-out');
  progressStep.classList.remove('fade-in');

  // Swap icon with animation
  stepIcon.className = 'step-icon';
  stepIcon.textContent = step.icon;
  void stepIcon.offsetWidth;
  stepIcon.classList.add('anim-' + step.anim);

  // Fade in new text
  setTimeout(() => {
    progressStep.textContent = step.text;
    progressStep.classList.remove('fade-out');
    progressStep.classList.add('fade-in');
  }, 150);

  // Twemoji
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

  let mainStepIndex = 0;
  let tick = 0;

  // Barra de progresso — nunca para, desacelera assintoticamente
  progressInterval = setInterval(() => {
    tick++;

    if (apiDone) {
      // API retornou — acelera pra 100%
      currentProgress += (100 - currentProgress) * 0.3;
      if (currentProgress >= 99.8) {
        currentProgress = 100;
        clearInterval(progressInterval);
        progressInterval = null;
        finishProgress();
      }
    } else {
      // Barra desacelera: avanca rapido no inicio, lento no fim
      // Nunca passa de 99% sem a API ter retornado
      const maxProgress = 99;
      const speed = Math.max(0.08, (maxProgress - currentProgress) * 0.012);
      currentProgress = Math.min(currentProgress + speed, maxProgress);
    }

    progressFill.style.width = currentProgress + '%';
    progressPercent.textContent = Math.round(currentProgress) + '%';

    // Mudar etapa principal conforme progresso (ate ~88%)
    if (mainStepIndex < MAIN_STEPS.length) {
      const threshold = (mainStepIndex + 1) * (88 / MAIN_STEPS.length);
      if (currentProgress >= threshold) {
        showStep(MAIN_STEPS[mainStepIndex]);
        mainStepIndex++;

        // Quando acabaram as etapas principais, iniciar ciclo de extras
        if (mainStepIndex >= MAIN_STEPS.length && !stepCycleInterval) {
          startExtraCycle();
        }
      }
    }
  }, 200);
}

// Ciclo de mensagens extras — roda a cada 4s infinitamente
function startExtraCycle() {
  let extraIndex = 0;
  stepCycleInterval = setInterval(() => {
    if (apiDone) return; // para de trocar se API ja voltou
    showStep(EXTRA_STEPS[extraIndex % EXTRA_STEPS.length]);
    extraIndex++;
  }, 4000);
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (stepCycleInterval) {
    clearInterval(stepCycleInterval);
    stepCycleInterval = null;
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
