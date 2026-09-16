/**
 * CSI Digital - Red Team vs Blue Team: Facilitator Dashboard Logic
 * Admite:
 * 1. Modo Caso Guiado (Guided Mode)
 * 2. Modo Duelo Cruzado PvP (PvP Mode con WhatsApp, Instagram & Correo)
 * 3. Modo Laboratorio / Armador de Mensajes (Builder Mode individual con feedback instantáneo)
 */

document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // State
  let activeSession = null;
  let availableCases = [];
  let availablePvPThemes = [];
  let availableBuilderScenarios = [];
  let currentSelectedMode = 'guided'; // 'guided' | 'pvp' | 'builder'
  let selectedCaseId = 'caso-banco-phishing';
  let selectedPvPThemeId = 'theme-instagram-dm';
  let selectedBuilderScenarioId = 'builder-whatsapp';
  let selectedBuilderObjective = 'phishing'; // 'phishing' | 'legitimate'

  // DOM Elements - Wizard
  const wizardSection = document.getElementById('wizardSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const modeCardGuided = document.getElementById('modeCardGuided');
  const modeCardPvP = document.getElementById('modeCardPvP');
  const modeCardBuilder = document.getElementById('modeCardBuilder');

  const guidedCaseContainer = document.getElementById('guidedCaseContainer');
  const pvpThemeContainer = document.getElementById('pvpThemeContainer');
  const builderConfigContainer = document.getElementById('builderConfigContainer');

  const casesContainer = document.getElementById('casesContainer');
  const pvpThemesGrid = document.getElementById('pvpThemesGrid');
  const builderScenariosGrid = document.getElementById('builderScenariosGrid');

  const objCardPhishing = document.getElementById('objCardPhishing');
  const objCardLegitimate = document.getElementById('objCardLegitimate');

  const groupCountWrapper = document.getElementById('groupCountWrapper');
  const groupCountInput = document.getElementById('groupCountInput');
  const studentCountWrapper = document.getElementById('studentCountWrapper');
  const studentCountInput = document.getElementById('studentCountInput');

  const durationInput = document.getElementById('durationInput');
  const durationValDisplay = document.getElementById('durationValDisplay');
  const btnCreateSession = document.getElementById('btnCreateSession');

  // DOM Elements - Dashboard
  const sessionCodePill = document.getElementById('sessionCodePill');
  const sessionCaseTitle = document.getElementById('sessionCaseTitle');
  const btnOpenQR = document.getElementById('btnOpenQR');
  const btnOpenProjector = document.getElementById('btnOpenProjector');
  const btnExportReport = document.getElementById('btnExportReport');
  const facTimerDigits = document.getElementById('facTimerDigits');

  // Timer Buttons
  const btnStartTimer = document.getElementById('btnStartTimer');
  const btnPauseTimer = document.getElementById('btnPauseTimer');
  const btnResetTimer = document.getElementById('btnResetTimer');
  const btnAddMin = document.getElementById('btnAddMin');
  const btnSubMin = document.getElementById('btnSubMin');
  const btnForceClose = document.getElementById('btnForceClose');

  // Projection Controls
  const projModeButtons = document.querySelectorAll('.btn-proj-mode');
  const btnProjReview = document.getElementById('btnProjReview');
  const btnProjRevelation = document.getElementById('btnProjRevelation');
  const reviewNavContainer = document.getElementById('reviewNavContainer');
  const reviewCurrentGroupLabel = document.getElementById('reviewCurrentGroupLabel');
  const btnPrevReview = document.getElementById('btnPrevReview');
  const btnNextReview = document.getElementById('btnNextReview');

  // Dashboard Sections
  const builderParticipantsSection = document.getElementById('builderParticipantsSection');
  const builderParticipantsGrid = document.getElementById('builderParticipantsGrid');
  const builderStatsSubtitle = document.getElementById('builderStatsSubtitle');
  const builderObjectiveBadge = document.getElementById('builderObjectiveBadge');

  const pvpMatchesSection = document.getElementById('pvpMatchesSection');
  const pvpMatchesGrid = document.getElementById('pvpMatchesGrid');
  const groupsMonitorSection = document.getElementById('groupsMonitorSection');
  const groupsMonitorGrid = document.getElementById('groupsMonitorGrid');

  // Modals
  const qrModal = document.getElementById('qrModal');
  const qrImage = document.getElementById('qrImage');
  const qrCodeText = document.getElementById('qrCodeText');
  const btnCloseQR = document.getElementById('btnCloseQR');

  const answerModal = document.getElementById('answerModal');
  const answerModalContent = document.getElementById('answerModalContent');
  const btnCloseAnswer = document.getElementById('btnCloseAnswer');

  const newCaseModal = document.getElementById('newCaseModal');
  const btnOpenNewCase = document.getElementById('btnOpenNewCase');
  const btnCloseNewCase = document.getElementById('btnCloseNewCase');
  const btnSaveNewCase = document.getElementById('btnSaveNewCase');

  // Initial Load
  loadAvailableData();

  // Mode Selection Handlers
  modeCardGuided.addEventListener('click', () => {
    selectGameMode('guided');
  });

  modeCardPvP.addEventListener('click', () => {
    selectGameMode('pvp');
  });

  modeCardBuilder.addEventListener('click', () => {
    selectGameMode('builder');
  });

  function selectGameMode(mode) {
    currentSelectedMode = mode;
    modeCardGuided.classList.toggle('selected', mode === 'guided');
    modeCardPvP.classList.toggle('selected', mode === 'pvp');
    modeCardBuilder.classList.toggle('selected', mode === 'builder');

    guidedCaseContainer.style.display = mode === 'guided' ? 'block' : 'none';
    pvpThemeContainer.style.display = mode === 'pvp' ? 'block' : 'none';
    builderConfigContainer.style.display = mode === 'builder' ? 'block' : 'none';

    groupCountWrapper.style.display = mode === 'builder' ? 'none' : 'block';
    studentCountWrapper.style.display = mode === 'builder' ? 'block' : 'none';
  }

  // Builder Objective Selection Handlers
  if (objCardPhishing && objCardLegitimate) {
    objCardPhishing.addEventListener('click', () => {
      selectedBuilderObjective = 'phishing';
      objCardPhishing.classList.add('selected');
      objCardPhishing.style.borderColor = 'var(--red)';
      objCardLegitimate.classList.remove('selected');
      objCardLegitimate.style.borderColor = '';
    });

    objCardLegitimate.addEventListener('click', () => {
      selectedBuilderObjective = 'legitimate';
      objCardLegitimate.classList.add('selected');
      objCardLegitimate.style.borderColor = 'var(--green)';
      objCardPhishing.classList.remove('selected');
      objCardPhishing.style.borderColor = '';
    });
  }

  // Duration Slider change
  if (durationInput && durationValDisplay) {
    durationInput.addEventListener('input', () => {
      durationValDisplay.innerText = `${durationInput.value} min`;
    });
  }

  // Load cases, PvP themes & Builder scenarios from backend
  async function loadAvailableData() {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.success) {
        availableCases = data.cases || [];
        availablePvPThemes = data.pvpThemes || [];
        availableBuilderScenarios = data.builderScenarios || [];

        if (availableCases.length && !selectedCaseId) {
          selectedCaseId = availableCases[0].id;
        }
        if (availablePvPThemes.length) {
          selectedPvPThemeId = availablePvPThemes[0].id;
        }
        if (availableBuilderScenarios.length) {
          selectedBuilderScenarioId = availableBuilderScenarios[0].id;
        }

        renderCaseOptions();
        renderPvPThemeOptions();
        renderBuilderScenarioOptions();
      }
    } catch (e) {
      console.error('Error fetching cases data:', e);
    }
  }

  // 1. Render Guided Case Cards
  function renderCaseOptions() {
    casesContainer.innerHTML = availableCases.map(c => `
      <div class="case-option-card ${c.id === selectedCaseId ? 'selected' : ''}" data-id="${c.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="color: var(--cyan);">${c.title}</h4>
          <span class="badge badge-cyan">${c.badge || (c.type ? c.type.toUpperCase() : 'CASO')}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${c.description}</p>
        <div style="font-size: 0.75rem; color: var(--text-dim);">
          🎯 5 anomalías etiquetadas · Dificultad: ${c.difficulty || 'Normal'}
        </div>
      </div>
    `).join('');

    casesContainer.querySelectorAll('.case-option-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedCaseId = card.dataset.id;
        renderCaseOptions();
      });
    });
  }

  // 2. Render PvP Theme Cards
  function renderPvPThemeOptions() {
    pvpThemesGrid.innerHTML = availablePvPThemes.map(t => {
      const appIcon = t.appType === 'instagram' ? '📸' : (t.appType === 'whatsapp' ? '💬' : '📩');
      const senderText = t.defaultSender || (t.defaultUsername ? `@${t.defaultUsername}` : (t.defaultAddress || 'Remitente predeterminado'));
      return `
        <div class="case-option-card ${t.id === selectedPvPThemeId ? 'selected' : ''}" data-id="${t.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h4 style="color: var(--red);">${t.title}</h4>
            <span class="badge badge-red">${appIcon} ${t.appType.toUpperCase()}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${t.description}</p>
          <div style="font-size: 0.75rem; color: var(--text-dim);">
            ⚡ Remitente sugerido: <strong style="color: #ffffff;">${senderText}</strong>
          </div>
        </div>
      `;
    }).join('');

    pvpThemesGrid.querySelectorAll('.case-option-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedPvPThemeId = card.dataset.id;
        renderPvPThemeOptions();
      });
    });
  }

  // 3. Render Builder Scenario Cards
  function renderBuilderScenarioOptions() {
    builderScenariosGrid.innerHTML = availableBuilderScenarios.map(s => {
      const appIcon = s.appType === 'instagram' ? '📸' : (s.appType === 'whatsapp' ? '💬' : '📩');
      const totalCategories = (s.categories || []).length;
      return `
        <div class="case-option-card ${s.id === selectedBuilderScenarioId ? 'selected' : ''}" data-id="${s.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h4 style="color: var(--yellow);">${s.title}</h4>
            <span class="badge badge-yellow">${appIcon} ${s.appType.toUpperCase()}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${s.description}</p>
          <div style="font-size: 0.75rem; color: var(--text-dim);">
            🧩 ${totalCategories} componentes para armar (Remitente, Cuerpo, Enlace, Urgencia)
          </div>
        </div>
      `;
    }).join('');

    builderScenariosGrid.querySelectorAll('.case-option-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedBuilderScenarioId = card.dataset.id;
        renderBuilderScenarioOptions();
      });
    });
  }

  // Create Session
  btnCreateSession.addEventListener('click', async () => {
    btnCreateSession.disabled = true;
    btnCreateSession.innerText = 'Creando sesión...';

    const groupCount = parseInt(groupCountInput.value, 10) || 4;
    const studentCount = parseInt(studentCountInput.value, 10) || 25;
    const durationMinutes = parseInt(durationInput.value, 10) || 15;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: currentSelectedMode,
          caseId: selectedCaseId,
          pvpThemeId: selectedPvPThemeId,
          builderScenarioId: selectedBuilderScenarioId,
          builderObjective: selectedBuilderObjective,
          studentCount,
          groupCount,
          durationMinutes,
          roleAssignment: 'auto'
        })
      });
      const data = await res.json();

      if (data.success) {
        activeSession = data.session;
        initDashboard(activeSession);
      } else {
        alert('Error al crear la sesión: ' + data.message);
      }
    } catch (err) {
      alert('Error de conexión al crear sesión.');
      console.error(err);
    } finally {
      btnCreateSession.disabled = false;
      btnCreateSession.innerText = '✨ Crear Sesión de Taller';
    }
  });

  function initDashboard(session) {
    activeSession = session;
    wizardSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    const isPvP = session.mode === 'pvp';
    const isBuilder = session.mode === 'builder';

    sessionCodePill.innerText = session.code;

    if (isBuilder) {
      sessionCaseTitle.innerText = `🛠️ Armador: ${session.builderScenario?.title || 'Laboratorio Individual'}`;
      btnProjReview.innerText = '3. 🗣️ Galería / Creaciones';
      btnProjRevelation.style.display = 'none';
      builderParticipantsSection.style.display = 'block';
      pvpMatchesSection.style.display = 'none';
      groupsMonitorSection.style.display = 'none';

      const objLabel = session.builderObjective === 'phishing' ? '🎣 Phishing / Engaño' : '🟢 Legítimo / Seguro';
      builderObjectiveBadge.innerText = `Objetivo: ${objLabel}`;
      builderObjectiveBadge.className = session.builderObjective === 'phishing' ? 'badge badge-red' : 'badge badge-green';
    } else if (isPvP) {
      sessionCaseTitle.innerText = `⚔️ Duelo PvP: ${session.pvpTheme?.title || 'Cara a Cara'}`;
      btnProjReview.innerText = '3. ⚔️ Duelo Cara a Cara';
      btnProjRevelation.style.display = 'none';
      builderParticipantsSection.style.display = 'none';
      pvpMatchesSection.style.display = 'block';
      groupsMonitorSection.style.display = 'block';
    } else {
      sessionCaseTitle.innerText = `📁 ${session.caseData?.title || 'Caso Guiado'} (${(session.caseData?.type || 'caso').toUpperCase()})`;
      btnProjReview.innerText = '3. 🗣️ Puesta en Común';
      btnProjRevelation.style.display = 'inline-block';
      builderParticipantsSection.style.display = 'none';
      pvpMatchesSection.style.display = 'none';
      groupsMonitorSection.style.display = 'block';
    }

    if (session.qrDataUrl) {
      qrImage.src = session.qrDataUrl;
    }
    qrCodeText.innerText = session.code;

    socket.emit('join:facilitator', { code: session.code });

    updateTimerDisplay(session.timer.remainingSeconds);
    renderGroupsGrid();
    renderPvPMatchesGrid();
    renderBuilderParticipantsGrid();
    updateProjectionModeUI(session.projectionMode);
  }

  // Socket Events
  socket.on('session:facilitatorUpdate', (updatedSession) => {
    activeSession = updatedSession;
    updateTimerDisplay(activeSession.timer.remainingSeconds);
    renderGroupsGrid();
    renderPvPMatchesGrid();
    renderBuilderParticipantsGrid();
    updateProjectionModeUI(activeSession.projectionMode);
  });

  socket.on('timer:tick', ({ remainingSeconds }) => {
    updateTimerDisplay(remainingSeconds);
  });

  socket.on('timer:warning', ({ minutesLeft }) => {
    window.soundEngine.playTimerWarning();
  });

  socket.on('timer:expired', () => {
    updateTimerDisplay(0);
  });

  socket.on('group:draftUpdate', ({ groupId, draft, status }) => {
    if (activeSession && activeSession.groups) {
      const g = activeSession.groups.find(x => x.id === groupId);
      if (g) {
        g.draft = draft;
        g.status = status;
        renderGroupsGrid();
      }
    }
  });

  socket.on('group:submitted', () => {
    window.soundEngine.playSubmitSuccess();
  });

  // Timer controls handlers
  btnStartTimer.addEventListener('click', () => {
    if (!activeSession) return;
    socket.emit('timer:start', { code: activeSession.code });
    window.soundEngine.playBeep(800, 0.1);
  });

  btnPauseTimer.addEventListener('click', () => {
    if (!activeSession) return;
    socket.emit('timer:pause', { code: activeSession.code });
  });

  btnResetTimer.addEventListener('click', () => {
    if (!activeSession) return;
    if (confirm('¿Reiniciar el cronómetro al tiempo original?')) {
      socket.emit('timer:reset', { code: activeSession.code });
    }
  });

  btnAddMin.addEventListener('click', () => {
    if (!activeSession) return;
    socket.emit('timer:adjust', { code: activeSession.code, deltaSeconds: 60 });
  });

  btnSubMin.addEventListener('click', () => {
    if (!activeSession) return;
    socket.emit('timer:adjust', { code: activeSession.code, deltaSeconds: -60 });
  });

  btnForceClose.addEventListener('click', () => {
    if (!activeSession) return;
    if (confirm('¿Cerrar inmediatamente la ventana de respuestas para todos los participantes?')) {
      socket.emit('timer:close', { code: activeSession.code });
    }
  });

  function updateTimerDisplay(totalSecs) {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    facTimerDigits.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Projection Controls
  projModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (!activeSession) return;

      socket.emit('projection:setMode', {
        code: activeSession.code,
        mode: mode
      });

      if (mode === 'revelation' || mode === 'review') {
        window.soundEngine.playReveal();
      } else if (mode === 'ranking') {
        window.soundEngine.playVictoryFanfare();
      }
    });
  });

  function updateProjectionModeUI(mode) {
    projModeButtons.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const isPvP = activeSession?.mode === 'pvp';
    const isBuilder = activeSession?.mode === 'builder';

    if (mode === 'review') {
      reviewNavContainer.style.display = 'flex';
      if (isBuilder) {
        const activeIdx = activeSession.activeBuilderParticipantIndex || 0;
        const p = (activeSession.builderParticipants || [])[activeIdx];
        reviewCurrentGroupLabel.innerText = p ? `Alumno #${activeIdx + 1}: ${p.alias}` : 'Galería de Creaciones';
      } else if (isPvP) {
        const activeIdx = activeSession.activePvPMatchIndex || 0;
        const m = (activeSession.pvpMatches || [])[activeIdx];
        reviewCurrentGroupLabel.innerText = m ? `Duelo #${m.matchId}: ${m.redGroupName} ⚔️ ${m.blueGroupName}` : 'Duelo Cara a Cara';
      } else {
        const activeId = activeSession.activeReviewGroupId || 1;
        const g = (activeSession.groups || []).find(x => x.id === activeId);
        reviewCurrentGroupLabel.innerText = `Grupo ${activeId}: ${g ? g.name : ''} (${g ? g.role.toUpperCase() : ''})`;
      }
    } else {
      reviewNavContainer.style.display = 'none';
    }
  }

  // Review Navigation
  btnPrevReview.addEventListener('click', () => {
    if (!activeSession) return;
    socket.emit('projection:navigateReview', { code: activeSession.code, direction: 'prev' });
  });

  btnNextReview.addEventListener('click', () => {
    if (!activeSession) return;
    socket.emit('projection:navigateReview', { code: activeSession.code, direction: 'next' });
  });

  // Render Builder Participants Grid
  function renderBuilderParticipantsGrid() {
    if (!activeSession || activeSession.mode !== 'builder' || !activeSession.builderParticipants) return;

    const participants = activeSession.builderParticipants;
    const submittedCount = participants.filter(p => p.submitted).length;
    builderStatsSubtitle.innerText = `${participants.length} alumnos conectados · ${submittedCount} entregas completadas`;

    if (participants.length === 0) {
      builderParticipantsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px dashed var(--border-color);">
          <div style="font-size: 2rem; margin-bottom: 8px;">📡</div>
          <strong style="color: var(--text-muted);">Esperando que los alumnos se unan con el código ${activeSession.code}...</strong>
          <p style="font-size: 0.85rem; color: var(--text-dim); margin-top: 4px;">Pueden escanear el QR o ingresar a la web desde su celular.</p>
        </div>
      `;
      return;
    }

    builderParticipantsGrid.innerHTML = participants.map(p => {
      const isSubmitted = p.submitted;
      const isTyping = p.status === 'typing';

      let statusBadge = '<span class="badge badge-yellow">Conectado / Armando</span>';
      if (isSubmitted) {
        statusBadge = '<span class="badge badge-green">✓ Entregado</span>';
      } else if (isTyping) {
        statusBadge = '<span class="badge badge-cyan">✏️ Armando...</span>';
      }

      const score = p.score || { percentage: 0, totalPoints: 0 };
      const scoreBadge = isSubmitted
        ? `<span class="badge ${score.percentage >= 80 ? 'badge-green' : (score.percentage >= 50 ? 'badge-yellow' : 'badge-red')}">${score.percentage}% (${score.totalPoints} pts)</span>`
        : '<span style="font-size: 0.78rem; color: var(--text-dim);">En armado</span>';

      const choicesCount = Object.keys(p.choices || {}).length;

      return `
        <div class="card" style="border: 1px solid var(--border-color); background: rgba(0,0,0,0.3); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--yellow); font-size: 1.05rem;">👤 ${p.alias}</strong>
              ${statusBadge}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Progreso / Componentes:</span>
              <strong style="color: #ffffff;">${choicesCount} elegidos</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Calificación:</span>
              ${scoreBadge}
            </div>
          </div>

          <button type="button" class="btn btn-outline btn-sm btn-preview-builder" data-participant-id="${p.id}" style="width: 100%;">
            👁️ Ver Mensaje y Feedback
          </button>
        </div>
      `;
    }).join('');

    builderParticipantsGrid.querySelectorAll('.btn-preview-builder').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = parseInt(btn.dataset.participantId, 10);
        showBuilderAnswerModal(pId);
      });
    });
  }

  // Render PvP Matches Grid
  function renderPvPMatchesGrid() {
    if (!activeSession || activeSession.mode !== 'pvp' || !activeSession.pvpMatches) return;

    pvpMatchesGrid.innerHTML = activeSession.pvpMatches.map(m => {
      let statusBadge = '<span class="badge badge-yellow">En Preparación</span>';
      if (m.status === 'attack_sent') {
        statusBadge = '<span class="badge badge-cyan">Ataque en Inspección</span>';
      } else if (m.status === 'completed') {
        statusBadge = '<span class="badge badge-green">Duelo Finalizado</span>';
      }

      return `
        <div class="card" style="border: 1px solid var(--border-color); background: rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #ffffff;">Duelo #${m.matchId}</strong>
            ${statusBadge}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin: 10px 0;">
            <span class="badge badge-red">${m.redGroupName}</span>
            <span style="color: var(--text-dim); font-size: 0.8rem;">⚔️ VS ⚔️</span>
            <span class="badge badge-blue">${m.blueGroupName}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
            ${m.summary || 'Ataque y defensa en curso...'}
          </div>
          <button type="button" class="btn btn-outline btn-sm btn-preview-match" data-match-id="${m.matchId}" style="width: 100%;">
            👁️ Ver Detalles del Duelo
          </button>
        </div>
      `;
    }).join('');

    pvpMatchesGrid.querySelectorAll('.btn-preview-match').forEach(btn => {
      btn.addEventListener('click', () => {
        const matchId = parseInt(btn.dataset.matchId, 10);
        showPvPMatchModal(matchId);
      });
    });
  }

  // Render Groups Grid
  function renderGroupsGrid() {
    if (!activeSession || activeSession.mode === 'builder' || !activeSession.groups) return;

    groupsMonitorGrid.innerHTML = activeSession.groups.map(g => {
      const isRed = g.role === 'red';
      const isSubmitted = g.status === 'submitted';

      let dotClass = 'dot-disconnected';
      let statusText = 'Desconectado';
      if (g.status === 'connected') {
        dotClass = 'dot-connected';
        statusText = 'Conectado';
      } else if (g.status === 'typing') {
        dotClass = 'dot-typing';
        statusText = 'Escribiendo...';
      } else if (g.status === 'submitted') {
        dotClass = 'dot-submitted';
        statusText = `Entregado #${g.submissionOrder || 1}`;
      }

      return `
        <div class="group-card role-${g.role} ${isSubmitted ? 'status-submitted' : ''}">
          <div class="group-header-row">
            <div>
              <h3 style="font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                ${g.name}
                <span class="badge ${isRed ? 'badge-red' : 'badge-blue'}">${isRed ? 'RED TEAM' : 'BLUE TEAM'}</span>
              </h3>
            </div>
            <div class="group-status-indicator">
              <span class="status-dot ${dotClass}"></span>
              <span>${statusText}</span>
            </div>
          </div>

          <div class="group-score-summary">
            ${isRed ? `
              <div>
                <strong>Ataque Creado:</strong>
                <div style="margin-top: 4px; font-size: 0.8rem; color: var(--text-muted);">
                  ${isSubmitted ? 'Ataque listo y disparado.' : (g.status === 'typing' ? 'Redactando mensaje...' : 'Esperando')}
                </div>
                <div style="margin-top: 8px; font-weight: bold; color: var(--cyan);">
                  Puntaje Total: ${g.score.totalPoints || 0} pts
                </div>
              </div>
            ` : `
              <div>
                <strong>Detección Forense:</strong>
                <div style="margin-top: 4px; font-size: 0.8rem; color: var(--text-muted);">
                  ${isSubmitted ? `Completado (Aciertos: ${g.score.correctCount || 0})` : (g.receivedAttack ? '🚨 Analizando ataque entrante...' : '📡 Radar a la espera')}
                </div>
                <div style="margin-top: 8px; font-weight: bold; color: var(--cyan);">
                  Puntaje Total: ${g.score.totalPoints || 0} pts
                </div>
              </div>
            `}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button type="button" class="btn btn-outline btn-sm btn-preview-answer" data-group-id="${g.id}" style="width: 100%;">
              👁️ Ver Detalles en Vivo
            </button>
          </div>
        </div>
      `;
    }).join('');

    groupsMonitorGrid.querySelectorAll('.btn-preview-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const gId = parseInt(btn.dataset.groupId, 10);
        showAnswerModal(gId);
      });
    });
  }

  // --- MODAL VIEWS ---

  // 1. Show Builder Student Submission Modal
  function showBuilderAnswerModal(participantId) {
    if (!activeSession || !activeSession.builderParticipants) return;
    const participant = activeSession.builderParticipants.find(p => p.id === participantId);
    if (!participant) return;

    const scenario = activeSession.builderScenario;
    const appType = scenario?.appType || 'whatsapp';
    const choices = participant.choices || {};
    const feedback = participant.feedback;
    const score = participant.score || { percentage: 0, totalPoints: 0, maxPoints: 0 };

    // Assemble preview material from chosen options
    const previewMaterial = assembleBuilderMaterial(scenario, choices);

    let feedbackHtml = '';
    if (feedback && feedback.categoryScores) {
      feedbackHtml = `
        <div style="margin-top: 20px;">
          <h4 style="color: var(--cyan); margin-bottom: 12px;">📊 Desglose de Evaluación Pedagógica:</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${feedback.categoryScores.map(cat => `
              <div style="background: rgba(0,0,0,0.35); padding: 12px; border-radius: 8px; border-left: 4px solid ${cat.rating === 'optimal' ? 'var(--green)' : (cat.rating === 'good' ? 'var(--yellow)' : 'var(--red)')};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: #ffffff;">${cat.categoryIcon || '🧩'} ${cat.categoryLabel}:</strong>
                  <span class="badge ${cat.rating === 'optimal' ? 'badge-green' : (cat.rating === 'good' ? 'badge-yellow' : 'badge-red')}">${cat.points} / ${cat.maxPoints} pts</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 4px;">
                  Opción elegida: <em>"${cat.chosenOptionLabel}"</em>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted);">
                  ${cat.feedback}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    answerModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="color: var(--yellow); margin: 0;">👤 Alumno: ${participant.alias}</h3>
        <span class="badge ${participant.submitted ? 'badge-green' : 'badge-yellow'}">${participant.submitted ? '✓ Entregado' : '✏️ En Armado'}</span>
      </div>

      <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.2); padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-dim);">OBJETIVO:</span>
          <div style="font-weight: bold; color: ${activeSession.builderObjective === 'phishing' ? 'var(--red)' : 'var(--green)'};">
            ${activeSession.builderObjective === 'phishing' ? '🎣 Crear Ataque de Phishing' : '🟢 Crear Señuelo Legítimo'}
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.8rem; color: var(--text-dim);">PUNTAJE:</span>
          <div style="font-size: 1.2rem; font-weight: 900; color: var(--cyan);">
            ${score.percentage}% (${score.totalPoints}/${score.maxPoints} pts)
          </div>
        </div>
      </div>

      <h4 style="color: #ffffff; margin-bottom: 10px;">📱 Mensaje Ensamblado:</h4>
      <div style="margin-bottom: 16px;">
        ${CaseViewer.render(previewMaterial, appType)}
      </div>

      ${feedbackHtml}
    `;

    answerModal.classList.add('active');
  }

  // 2. Show PvP Match Modal
  function showPvPMatchModal(matchId) {
    if (!activeSession || !activeSession.pvpMatches) return;
    const match = activeSession.pvpMatches.find(m => m.matchId === matchId);
    if (!match) return;

    const attack = match.attackMaterial || {};
    const defense = match.defenseResult || {};
    const appType = attack.appType || (attack.username ? 'instagram' : (attack.contactNumber ? 'whatsapp' : 'email'));

    answerModalContent.innerHTML = `
      <h3 style="color: var(--red); margin-bottom: 8px;">⚔️ Duelo #${match.matchId}: ${match.redGroupName} vs ${match.blueGroupName}</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">Formato del duelo: <strong>${appType.toUpperCase()}</strong> · Estado: ${match.status}</p>

      <div style="margin-bottom: 16px;">
        <h4 style="color: var(--red); margin-bottom: 8px;">🔴 Ataque Diseñado por ${match.redGroupName}:</h4>
        ${CaseViewer.render(attack, appType)}
      </div>

      <div style="background: rgba(0,0,0,0.35); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 16px;">
        <h4 style="color: var(--blue); margin-bottom: 8px;">🔵 Veredicto y Análisis de ${match.blueGroupName}:</h4>
        <p><strong>Veredicto:</strong> ${defense.verdict === 'phishing' || defense.verdict === 'blocked' ? '🛡️ Ataque Detectado y Bloqueado' : (defense.verdict ? '⚠️ Cayeron en la trampa / Engaño' : 'Esperando respuesta...')}</p>
        <p><strong>Trampas Detectadas:</strong> ${(defense.detectedTraps || []).join(', ') || 'Ninguna marcada'}</p>
        <p><strong>Recomendación Forense:</strong> ${(defense.recommendations || []).join('; ') || 'Sin recomendación'}</p>
        ${match.winner ? `<p style="margin-top: 10px; font-weight: bold; color: var(--cyan);">🏆 Ganador del Duelo: ${match.winner === 'blue' ? match.blueGroupName : (match.winner === 'red' ? match.redGroupName : 'Empate')}</p>` : ''}
      </div>
    `;

    answerModal.classList.add('active');
  }

  // 3. Show Guided Group Modal
  function showAnswerModal(groupId) {
    const group = (activeSession.groups || []).find(g => g.id === groupId);
    if (!group) return;

    const isRed = group.role === 'red';
    const sub = group.submission || group.draft || {};
    const isPvP = activeSession.mode === 'pvp';

    let bodyHtml = '';
    if (isPvP) {
      if (isRed) {
        bodyHtml = `
          <h3 style="color: var(--red); margin-bottom: 12px;">🔴 Ataque PvP Creado — ${group.name}</h3>
          <p><strong>Remitente:</strong> ${sub.fromName || sub.username || '—'}</p>
          <p><strong>Asunto / Contexto:</strong> ${sub.subject || '—'}</p>
          <p><strong>Mensaje:</strong> ${sub.message || '—'}</p>
          <p><strong>Enlace:</strong> ${sub.linkUrl || '—'}</p>
          <p><strong>Trampas Sembradas:</strong> ${(sub.trapsHidden || []).join(', ') || 'Ninguna'}</p>
        `;
      } else {
        bodyHtml = `
          <h3 style="color: var(--blue); margin-bottom: 12px;">🔵 Respuesta de Defensa — ${group.name}</h3>
          <p><strong>Veredicto:</strong> ${sub.verdict === 'blocked' ? '🛡️ Bloquear y Reportar' : '⚠️ Caer en la trampa'}</p>
          <p><strong>Trampas Detectadas:</strong> ${(sub.detectedTraps || []).join(', ') || 'Ninguna'}</p>
          <p><strong>Recomendación:</strong> ${(sub.recommendations || []).join(', ') || 'Sin recomendación'}</p>
        `;
      }
    } else {
      if (isRed) {
        const f = sub.fields || sub.redFields || {};
        bodyHtml = `
          <h3 style="color: var(--red); margin-bottom: 16px;">⚔️ Respuesta Red Team — ${group.name}</h3>
          <p><strong>1. Historia / Pretexto:</strong> ${f.story || '—'}</p>
          <p><strong>2. Gancho de Urgencia:</strong> ${f.urgency || '—'}</p>
          <p><strong>3. Trampa Técnica:</strong> ${f.technical || '—'}</p>
        `;
      } else {
        const anomIds = sub.anomalies || sub.blueAnomalies || [];
        bodyHtml = `
          <h3 style="color: var(--blue); margin-bottom: 16px;">🛡️ Respuesta Blue Team — ${group.name}</h3>
          <p><strong>Anomalías Marcadas (${anomIds.length}):</strong> ${anomIds.join(', ') || 'Ninguna'}</p>
          <p><strong>Recomendaciones de Seguridad:</strong> ${(sub.recommendations || []).join('; ') || '—'}</p>
        `;
      }
    }

    answerModalContent.innerHTML = bodyHtml;
    answerModal.classList.add('active');
  }

  // Helper to build material object from builder choices
  function assembleBuilderMaterial(scenario, choices) {
    if (!scenario) return { message: 'Sin contenido' };
    const categories = scenario.categories || [];
    const appType = scenario.appType || 'whatsapp';

    const material = {
      appType: appType,
      contactName: 'Contacto Simulado',
      contactNumber: '+54 9 11 0000-0000',
      username: 'usuario_simulado',
      bio: '',
      fromName: 'Remitente Simulado',
      fromEmail: 'remitente@correo.com',
      subject: 'Aviso Importante',
      message: 'Mensaje de prueba',
      linkUrl: '',
      hasVoiceNote: false
    };

    categories.forEach(cat => {
      const chosenOptionId = choices[cat.id];
      const opt = (cat.options || []).find(o => o.id === chosenOptionId);
      if (opt) {
        if (opt.preview) {
          Object.assign(material, opt.preview);
        }
        if (cat.id === 'sender') {
          if (opt.preview) Object.assign(material, opt.preview);
        } else if (cat.id === 'body' || cat.id === 'content') {
          material.message = opt.label;
        } else if (cat.id === 'link') {
          material.linkUrl = opt.id === 'link_none' ? '' : opt.label;
        } else if (cat.id === 'extra' && opt.id === 'extra_voicenote') {
          material.hasVoiceNote = true;
        }
      }
    });

    return material;
  }

  if (btnCloseAnswer) {
    btnCloseAnswer.addEventListener('click', () => {
      answerModal.classList.remove('active');
    });
  }

  // QR Modal
  btnOpenQR.addEventListener('click', () => {
    qrModal.classList.add('active');
  });

  if (btnCloseQR) {
    btnCloseQR.addEventListener('click', () => {
      qrModal.classList.remove('active');
    });
  }

  // Open Projector Screen in new window
  btnOpenProjector.addEventListener('click', () => {
    if (activeSession) {
      window.open(`/proyeccion.html?code=${activeSession.code}`, '_blank');
    }
  });

  // Export Report
  btnExportReport.addEventListener('click', () => {
    if (activeSession) {
      window.open(`/api/sessions/${activeSession.code}/export?format=html`, '_blank');
    }
  });
});
