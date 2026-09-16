/**
 * CSI Digital - Red Team vs Blue Team: Student App Logic
 * Soporta:
 * 1. Modo Caso Guiado (Guided Mode)
 * 2. Modo Duelo Cruzado (PvP Mode con Instagram DM, WhatsApp y Correo)
 * 3. Modo Laboratorio / Armador de Mensajes (Builder Mode individual con feedback interactivo)
 */

document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // State
  let currentSessionCode = '';
  let currentGroupId = null;
  let joinMode = 'group'; // 'group' | 'alias'
  let sessionData = null;
  let groupData = null;
  let participantData = null;
  let builderChoices = {};
  let draftTimeout = null;
  let activeAppFormat = 'whatsapp'; // 'instagram' | 'whatsapp' | 'email'

  // DOM Elements - Join Section
  const joinSection = document.getElementById('joinSection');
  const gameSection = document.getElementById('gameSection');
  const codeInput = document.getElementById('sessionCodeInput');
  const tabJoinGroup = document.getElementById('tabJoinGroup');
  const tabJoinAlias = document.getElementById('tabJoinAlias');
  const groupSelectWrapper = document.getElementById('groupSelectWrapper');
  const aliasInputWrapper = document.getElementById('aliasInputWrapper');
  const groupSelect = document.getElementById('groupSelect');
  const aliasInput = document.getElementById('aliasInput');
  const btnJoin = document.getElementById('btnJoin');
  const joinError = document.getElementById('joinError');

  // DOM Elements - Game Header & Containers
  const teamBadgeEl = document.getElementById('teamBadge');
  const groupNameEl = document.getElementById('groupName');
  const timerDigitsEl = document.getElementById('timerDigits');
  const timerBoxEl = document.getElementById('timerBox');
  const materialContainer = document.getElementById('materialContainer');
  const worksheetContainer = document.getElementById('worksheetContainer');
  const soundToggleBtn = document.getElementById('soundToggle');

  // Modals
  const submitConfirmModal = document.getElementById('submitConfirmModal');
  const btnCancelSubmit = document.getElementById('btnCancelSubmit');
  const btnConfirmSubmit = document.getElementById('btnConfirmSubmit');

  // Audio Toggle
  if (soundToggleBtn) {
    updateSoundIcon();
    soundToggleBtn.addEventListener('click', () => {
      window.soundEngine.toggleMute();
      updateSoundIcon();
    });
  }

  function updateSoundIcon() {
    if (soundToggleBtn) {
      soundToggleBtn.innerHTML = window.soundEngine.isMuted() ? '🔇' : '🔊';
    }
  }

  // Join Mode Tabs
  if (tabJoinGroup && tabJoinAlias) {
    tabJoinGroup.addEventListener('click', () => {
      joinMode = 'group';
      tabJoinGroup.className = 'btn btn-cyan btn-sm';
      tabJoinAlias.className = 'btn btn-outline btn-sm';
      groupSelectWrapper.style.display = 'block';
      aliasInputWrapper.style.display = 'none';
    });

    tabJoinAlias.addEventListener('click', () => {
      joinMode = 'alias';
      tabJoinAlias.className = 'btn btn-cyan btn-sm';
      tabJoinGroup.className = 'btn btn-outline btn-sm';
      groupSelectWrapper.style.display = 'none';
      aliasInputWrapper.style.display = 'block';
    });
  }

  // Auto-fill from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paramCode = urlParams.get('code');
  const paramGroup = urlParams.get('group');
  const paramAlias = urlParams.get('alias');

  if (paramCode) {
    codeInput.value = paramCode.toUpperCase();
    if (paramGroup) {
      groupSelect.value = paramGroup;
      setTimeout(() => attemptJoin(), 300);
    } else if (paramAlias) {
      joinMode = 'alias';
      if (tabJoinAlias) tabJoinAlias.click();
      aliasInput.value = paramAlias;
      setTimeout(() => attemptJoin(), 300);
    }
  }

  btnJoin.addEventListener('click', attemptJoin);
  codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptJoin();
  });
  if (aliasInput) {
    aliasInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') attemptJoin();
    });
  }

  function attemptJoin() {
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
      showError('Por favor ingresá el código de sesión.');
      return;
    }

    currentSessionCode = code;
    hideError();
    btnJoin.disabled = true;
    btnJoin.innerText = 'Conectando...';

    if (joinMode === 'alias') {
      const alias = (aliasInput.value || '').trim();
      if (!alias) {
        showError('Por favor ingresá tu nombre o alias.');
        btnJoin.disabled = false;
        btnJoin.innerText = '⚡ Conectar Dispositivo';
        return;
      }
      socket.emit('join:builder', { code, alias });
    } else {
      const groupId = parseInt(groupSelect.value, 10);
      if (!groupId) {
        showError('Por favor seleccioná el número de grupo.');
        btnJoin.disabled = false;
        btnJoin.innerText = '⚡ Conectar Dispositivo';
        return;
      }
      currentGroupId = groupId;
      socket.emit('join:group', { code, groupId });
    }
  }

  function showError(msg) {
    joinError.innerText = msg;
    joinError.style.display = 'block';
  }

  function hideError() {
    joinError.style.display = 'none';
  }

  // Socket Events
  socket.on('error', (err) => {
    showError(err.message || 'Error de conexión.');
    btnJoin.disabled = false;
    btnJoin.innerText = '⚡ Conectar Dispositivo';
  });

  socket.on('group:connected', ({ session, group }) => {
    sessionData = session;
    groupData = group;

    joinSection.style.display = 'none';
    gameSection.style.display = 'block';

    initGameView();
  });

  socket.on('builder:connected', ({ session, participant }) => {
    sessionData = session;
    participantData = participant;
    builderChoices = participant.choices || {};

    joinSection.style.display = 'none';
    gameSection.style.display = 'block';

    initGameView();
  });

  socket.on('session:update', (updatedSession) => {
    sessionData = updatedSession;
    if (sessionData.mode === 'builder' && participantData) {
      const updatedP = (sessionData.builderParticipants || []).find(p => p.id === participantData.id);
      if (updatedP) {
        participantData = updatedP;
        if (participantData.submitted) {
          renderBuilderResultsView();
        }
      }
    } else if (currentGroupId && sessionData.groups) {
      const updatedGroup = sessionData.groups.find(g => g.id === currentGroupId);
      if (updatedGroup) {
        groupData = updatedGroup;
        if (sessionData.mode === 'pvp') {
          renderPvPView();
        } else if (groupData.status === 'submitted') {
          renderSubmittedView();
        }
      }
    }
  });

  socket.on('timer:tick', ({ remainingSeconds }) => {
    updateTimerDisplay(remainingSeconds);
  });

  socket.on('timer:warning', ({ minutesLeft }) => {
    window.soundEngine.playTimerWarning();
    if (minutesLeft === 1) {
      timerBoxEl.className = 'student-timer-box timer-danger';
    } else {
      timerBoxEl.className = 'student-timer-box timer-warning';
    }
  });

  socket.on('timer:expired', () => {
    timerDigitsEl.innerText = '00:00';
    timerBoxEl.className = 'student-timer-box timer-danger';
  });

  socket.on('submit:success', ({ group }) => {
    groupData = group;
    window.soundEngine.playSubmitSuccess();
    if (submitConfirmModal) submitConfirmModal.classList.remove('active');
    renderSubmittedView();
  });

  socket.on('pvp:attackSuccess', ({ group }) => {
    groupData = group;
    window.soundEngine.playSubmitSuccess();
    if (submitConfirmModal) submitConfirmModal.classList.remove('active');
    renderPvPRedWaiting();
  });

  socket.on('pvp:attackReceived', ({ attackMaterial, attackerName }) => {
    if (groupData && groupData.role === 'blue') {
      groupData.receivedAttack = attackMaterial;
      groupData.pvpPhase = 'detecting';
      window.soundEngine.playTimerWarning();
      renderPvPBlueDetecting();
    }
  });

  socket.on('pvp:defenseSuccess', ({ group, match }) => {
    groupData = group;
    window.soundEngine.playSubmitSuccess();
    if (submitConfirmModal) submitConfirmModal.classList.remove('active');
    renderPvPDefenseResult(match);
  });

  socket.on('builder:choiceSubmitted', ({ participant, feedback, ranking }) => {
    participantData = participant;
    participantData.feedback = feedback;
    window.soundEngine.playSubmitSuccess();
    if (submitConfirmModal) submitConfirmModal.classList.remove('active');
    renderBuilderResultsView();
  });

  function initGameView() {
    const isBuilder = sessionData.mode === 'builder';
    const isPvP = sessionData.mode === 'pvp';

    if (isBuilder) {
      groupNameEl.innerText = participantData.alias;
      const isPhishing = sessionData.builderObjective === 'phishing';
      teamBadgeEl.className = `badge ${isPhishing ? 'badge-red' : 'badge-green'}`;
      teamBadgeEl.innerHTML = isPhishing ? '🎣 MISIÓN: PHISHING' : '🟢 MISIÓN: LEGÍTIMO';

      updateTimerDisplay(sessionData.timer?.remainingSeconds || 900);

      if (participantData.submitted) {
        renderBuilderResultsView();
      } else {
        renderBuilderView();
      }
      return;
    }

    const isRed = groupData.role === 'red';
    groupNameEl.innerText = groupData.name;
    teamBadgeEl.className = `badge ${isRed ? 'badge-red' : 'badge-blue'}`;
    teamBadgeEl.innerHTML = isRed
      ? (isPvP ? '🔴 RED TEAM (DUELO PvP)' : '🔴 RED TEAM — ATACANTES')
      : (isPvP ? '🔵 BLUE TEAM (DUELO PvP)' : '🔵 BLUE TEAM — DEFENSORES');

    updateTimerDisplay(sessionData.timer ? sessionData.timer.remainingSeconds : 900);

    if (isPvP) {
      if (sessionData.pvpTheme?.appType) {
        activeAppFormat = sessionData.pvpTheme.appType;
      }
      renderPvPView();
    } else {
      renderGuidedView();
    }
  }

  function updateTimerDisplay(totalSecs) {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    timerDigitsEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (totalSecs <= 60 && totalSecs > 0) {
      timerBoxEl.className = 'student-timer-box timer-danger';
    } else if (totalSecs <= 120 && totalSecs > 0) {
      timerBoxEl.className = 'student-timer-box timer-warning';
    } else {
      timerBoxEl.className = 'student-timer-box';
    }
  }

  // =========================================================================
  // 1. BUILDER MODE (Laboratorio Individual)
  // =========================================================================
  function renderBuilderView() {
    materialContainer.innerHTML = '';
    const scenario = sessionData.builderScenario;
    if (!scenario) return;

    const appType = scenario.appType || 'whatsapp';
    const isPhishing = sessionData.builderObjective === 'phishing';
    const categories = scenario.categories || [];

    // Initialize defaults if empty
    categories.forEach(cat => {
      if (!builderChoices[cat.id] && cat.options && cat.options.length) {
        builderChoices[cat.id] = cat.options[0].id;
      }
    });

    const assembled = assembleBuilderMaterial(scenario, builderChoices);

    worksheetContainer.innerHTML = `
      <div class="card role-section-card" style="border-top: 4px solid var(--yellow);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h2 style="color: var(--yellow); font-size: 1.3rem;">🛠️ ${scenario.title}</h2>
            <div style="font-size: 0.85rem; color: var(--text-dim); margin-top: 2px;">
              Elegí los componentes para construir el mensaje según tu objetivo.
            </div>
          </div>
          <span class="badge ${isPhishing ? 'badge-red' : 'badge-green'}">
            ${isPhishing ? '🎣 Objetivo: Phishing' : '🟢 Objetivo: Legítimo'}
          </span>
        </div>

        <!-- Objective Explanatory Banner -->
        <div style="background: rgba(0,0,0,0.35); border-left: 4px solid ${isPhishing ? 'var(--red)' : 'var(--green)'}; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #ffffff; font-size: 0.95rem;">
            ${isPhishing ? '🔴 Tu Misión: Crear un Engaño Indetectable' : '🟢 Tu Misión: Crear una Comunicación Oficial y Confiable'}
          </strong>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
            ${isPhishing
              ? 'Combiná remitente creíble, disparador de urgencia/premio y trampa técnica para que la víctima caiga sin sospechar.'
              : 'Utilizá canales oficiales, tono formal y evita generar urgencias excesivas o enlaces a hostings sospechosos.'}
          </p>
        </div>

        <!-- Live Realistic Simulation Preview -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label class="form-label" style="margin: 0; color: #ffffff;">📱 Vista Previa en Vivo (Simulador):</label>
            <span style="font-size: 0.75rem; color: var(--cyan);">Se actualiza automáticamente</span>
          </div>
          <div id="builderLivePreviewBox">
            ${CaseViewer.render(assembled, appType)}
          </div>
        </div>

        <!-- Category Steps Accordion -->
        <div style="display: flex; flex-direction: column; gap: 18px;">
          ${categories.map((cat, catIdx) => `
            <div class="card" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); padding: 16px; border-radius: 10px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 1.3rem;">${cat.icon || '🧩'}</span>
                <div>
                  <strong style="color: #ffffff; font-size: 1.05rem;">Paso ${catIdx + 1}: ${cat.label}</strong>
                  <div style="font-size: 0.78rem; color: var(--text-dim);">${cat.description}</div>
                </div>
              </div>

              <div class="builder-options-list" style="display: flex; flex-direction: column; gap: 8px;">
                ${cat.options.map(opt => {
                  const isSelected = builderChoices[cat.id] === opt.id;
                  return `
                    <div class="case-option-card ${isSelected ? 'selected' : ''} builder-opt-card" data-cat-id="${cat.id}" data-opt-id="${opt.id}" style="padding: 12px; cursor: pointer; border-radius: 8px;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="radio" name="cat_${cat.id}" value="${opt.id}" ${isSelected ? 'checked' : ''} style="accent-color: var(--cyan); cursor: pointer;">
                        <div style="flex: 1;">
                          <div style="font-weight: 600; font-size: 0.92rem; color: #ffffff;">${opt.label}</div>
                          ${opt.preview?.bio ? `<div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">Bio: ${opt.preview.bio}</div>` : ''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 24px;">
          <button type="button" id="btnSubmitBuilder" class="btn btn-cyan btn-lg" style="width: 100%;">
            🚀 Enviar Mensaje para Calificación
          </button>
        </div>
      </div>
    `;

    // Attach click events on option cards
    worksheetContainer.querySelectorAll('.builder-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.dataset.catId;
        const optId = card.dataset.optId;
        builderChoices[catId] = optId;

        // Re-render choices selection states
        card.parentElement.querySelectorAll('.builder-opt-card').forEach(c => {
          const sel = c.dataset.optId === optId;
          c.classList.toggle('selected', sel);
          const radio = c.querySelector('input[type="radio"]');
          if (radio) radio.checked = sel;
        });

        // Update live preview
        const newAssembled = assembleBuilderMaterial(scenario, builderChoices);
        const previewBox = document.getElementById('builderLivePreviewBox');
        if (previewBox) {
          previewBox.innerHTML = CaseViewer.render(newAssembled, appType);
        }

        // Notify facilitator draft update
        socket.emit('builder:draftUpdate', {
          code: currentSessionCode,
          participantId: participantData.id,
          choices: builderChoices
        });
      });
    });

    const btnSubmitBuilder = document.getElementById('btnSubmitBuilder');
    if (btnSubmitBuilder) {
      btnSubmitBuilder.addEventListener('click', () => {
        if (submitConfirmModal) {
          submitConfirmModal.classList.add('active');
        }
      });
    }
  }

  function renderBuilderResultsView() {
    materialContainer.innerHTML = '';
    const scenario = sessionData.builderScenario;
    const appType = scenario?.appType || 'whatsapp';
    const feedback = participantData.feedback;
    const score = participantData.score || { percentage: 0, totalPoints: 0, maxPoints: 0 };
    const assembled = assembleBuilderMaterial(scenario, participantData.choices || builderChoices);

    worksheetContainer.innerHTML = `
      <div class="card" style="border-top: 4px solid var(--cyan); padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 3rem; margin-bottom: 8px;">
            ${score.percentage >= 80 ? '🏆' : (score.percentage >= 50 ? '🎯' : '📚')}
          </div>
          <h2 class="gradient-text-cyan" style="font-size: 1.8rem; margin-bottom: 4px;">
            ¡Mensaje Evaluado con Éxito!
          </h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Tu mensaje fue analizado por el sistema forense de CSI Digital.
          </p>

          <div style="display: inline-block; background: rgba(0, 240, 255, 0.1); border: 2px solid var(--cyan); border-radius: 16px; padding: 14px 28px; margin: 16px 0;">
            <div style="font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase; font-weight: bold;">Eficacia Táctica</div>
            <div style="font-size: 2.2rem; font-weight: 900; color: var(--cyan); font-family: var(--font-mono);">
              ${score.percentage}%
            </div>
            <div style="font-size: 0.9rem; color: #ffffff; font-weight: bold;">
              ${score.totalPoints} de ${score.maxPoints} puntos posibles
            </div>
          </div>
        </div>

        ${feedback?.overallMessage ? `
          <div style="background: rgba(0,0,0,0.4); border-left: 4px solid var(--cyan); padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 0.95rem; color: #ffffff;">
            ${feedback.overallMessage}
          </div>
        ` : ''}

        <h3 style="color: #ffffff; margin-bottom: 12px;">📱 Tu Mensaje Ensamblado:</h3>
        <div style="margin-bottom: 24px;">
          ${CaseViewer.render(assembled, appType)}
        </div>

        <h3 style="color: var(--cyan); margin-bottom: 14px;">📊 Desglose y Explicación por Componente:</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${(feedback?.categoryScores || []).map(cat => `
            <div style="background: rgba(0,0,0,0.35); padding: 14px; border-radius: 8px; border-left: 4px solid ${cat.rating === 'optimal' ? 'var(--green)' : (cat.rating === 'good' ? 'var(--yellow)' : 'var(--red)')};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: #ffffff; font-size: 1rem;">${cat.categoryIcon || '🧩'} ${cat.categoryLabel}:</strong>
                <span class="badge ${cat.rating === 'optimal' ? 'badge-green' : (cat.rating === 'good' ? 'badge-yellow' : 'badge-red')}">${cat.points}/${cat.maxPoints} pts</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 6px;">
                Elegiste: <em>"${cat.chosenOptionLabel}"</em>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                ${cat.feedback}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Helper to build material from builder choices
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
        if (opt.preview) Object.assign(material, opt.preview);
        if (cat.id === 'sender' && opt.preview) {
          Object.assign(material, opt.preview);
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

  // =========================================================================
  // 2. GUIDED MODE
  // =========================================================================
  function renderGuidedView() {
    renderMaterial();
    if (groupData.status === 'submitted') {
      renderSubmittedView();
    } else {
      renderWorksheet();
    }
  }

  function renderMaterial() {
    const caseData = sessionData.caseData;
    if (!caseData) return;

    materialContainer.innerHTML = `
      <div class="card case-material-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h2 style="font-size: 1.15rem; color: #ffffff;">📁 Caso: ${caseData.title}</h2>
            <span style="font-size: 0.8rem; color: var(--text-dim);">${caseData.subtitle || ''}</span>
          </div>
          <span class="badge badge-cyan">${caseData.type.toUpperCase()}</span>
        </div>

        <div style="margin-top: 8px;">
          ${CaseViewer.render(caseData.material, caseData.type)}
        </div>
      </div>
    `;
  }

  function renderWorksheet() {
    const isRed = groupData.role === 'red';
    const draft = groupData.draft || {};

    if (isRed) {
      const rf = draft.redFields || {};
      worksheetContainer.innerHTML = `
        <div class="card role-section-card team-card-red">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="color: var(--red);">🔴 Consigna Red Team (Atacantes)</h2>
            <span class="badge badge-red">Fase de Redacción</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Imaginen que son los ciberdelincuentes que diseñaron este engaño. Respondan cómo planearon el ataque:
          </p>

          <form id="redTeamForm">
            <div class="form-group">
              <label for="redStory" class="form-label">1. Historia / Pretexto (¿Cómo ganan confianza?)</label>
              <textarea id="redStory" class="form-control" rows="2" placeholder="Ej: Nos hacemos pasar por la dirección escolar avisando sobre un examen...">${rf.story || ''}</textarea>
            </div>

            <div class="form-group">
              <label for="redUrgency" class="form-label">2. Gancho de Urgencia (¿Por qué la víctima debe actuar ya?)</label>
              <textarea id="redUrgency" class="form-control" rows="2" placeholder="Ej: Amenazamos con dar de baja la cuenta en 24 horas...">${rf.urgency || ''}</textarea>
            </div>

            <div class="form-group">
              <label for="redTechnical" class="form-label">3. Trampa Técnica (¿Dónde está el engaño digital?)</label>
              <textarea id="redTechnical" class="form-control" rows="2" placeholder="Ej: El enlace dirige a un dominio clonado gratuito (.free.nf)...">${rf.technical || ''}</textarea>
            </div>

            <button type="button" id="btnSubmitRed" class="btn btn-red btn-lg" style="width: 100%; margin-top: 12px;">
              🚀 Enviar Respuestas del Red Team
            </button>
          </form>
        </div>
      `;

      attachDraftListeners('red');
      document.getElementById('btnSubmitRed').addEventListener('click', openSubmitConfirm);
    } else {
      const anoms = sessionData.caseData?.anomalies || [];
      const checkedAnoms = draft.blueAnomalies || [];
      const recs = draft.blueRecommendations || ['', '', ''];

      worksheetContainer.innerHTML = `
        <div class="card role-section-card team-card-blue">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="color: var(--blue);">🔵 Consigna Blue Team (Defensores)</h2>
            <span class="badge badge-blue">Fase Forense</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Analicen el material forense, marquen las 5 señales de alerta y redacten 3 recomendaciones para defenderse:
          </p>

          <form id="blueTeamForm">
            <label class="form-label">1. Checklist de Anomalías Detectadas (Marquen las 5 señales):</label>
            <div class="anomalies-selection-grid">
              ${anoms.map(a => `
                <div class="anomaly-check-card ${checkedAnoms.includes(a.id) ? 'selected' : ''}" data-id="${a.id}">
                  <input type="checkbox" class="anomaly-checkbox" ${checkedAnoms.includes(a.id) ? 'checked' : ''} tabindex="-1">
                  <div>
                    <strong>${a.title}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 2px;">${a.shortDesc || a.explanation}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <label class="form-label" style="margin-top: 20px;">2. Tres Recomendaciones de Defensa para la Víctima:</label>
            <div class="form-group" style="margin-bottom: 8px;">
              <input type="text" id="rec1" class="form-control" placeholder="Recomendación #1 (ej: Verificar siempre la dirección del remitente)" value="${recs[0] || ''}">
            </div>
            <div class="form-group" style="margin-bottom: 8px;">
              <input type="text" id="rec2" class="form-control" placeholder="Recomendación #2 (ej: Nunca ingresar contraseñas en sitios con .xyz)" value="${recs[1] || ''}">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <input type="text" id="rec3" class="form-control" placeholder="Recomendación #3 (ej: Consultar directamente con los directivos o padres)" value="${recs[2] || ''}">
            </div>

            <button type="button" id="btnSubmitBlue" class="btn btn-cyan btn-lg" style="width: 100%; margin-top: 12px;">
              🛡️ Enviar Informe de Defensa
            </button>
          </form>
        </div>
      `;

      attachDraftListeners('blue');
      document.getElementById('btnSubmitBlue').addEventListener('click', openSubmitConfirm);
    }
  }

  function attachDraftListeners(role) {
    if (role === 'red') {
      ['redStory', 'redUrgency', 'redTechnical'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', () => {
            clearTimeout(draftTimeout);
            draftTimeout = setTimeout(() => {
              const draft = {
                redFields: {
                  story: document.getElementById('redStory')?.value || '',
                  urgency: document.getElementById('redUrgency')?.value || '',
                  technical: document.getElementById('redTechnical')?.value || ''
                }
              };
              socket.emit('draft:save', { code: currentSessionCode, groupId: currentGroupId, draft });
            }, 600);
          });
        }
      });
    } else {
      const cards = worksheetContainer.querySelectorAll('.anomaly-check-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          card.classList.toggle('selected');
          const cb = card.querySelector('.anomaly-checkbox');
          if (cb) cb.checked = card.classList.contains('selected');
          triggerBlueDraftSave();
        });
      });

      ['rec1', 'rec2', 'rec3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', () => {
            clearTimeout(draftTimeout);
            draftTimeout = setTimeout(() => triggerBlueDraftSave(), 600);
          });
        }
      });
    }
  }

  function triggerBlueDraftSave() {
    const selectedAnoms = Array.from(worksheetContainer.querySelectorAll('.anomaly-check-card.selected')).map(c => c.dataset.id);
    const recs = [
      document.getElementById('rec1')?.value || '',
      document.getElementById('rec2')?.value || '',
      document.getElementById('rec3')?.value || ''
    ];
    const draft = { blueAnomalies: selectedAnoms, blueRecommendations: recs };
    socket.emit('draft:save', { code: currentSessionCode, groupId: currentGroupId, draft });
  }

  function renderSubmittedView() {
    materialContainer.innerHTML = '';
    const isRed = groupData.role === 'red';

    worksheetContainer.innerHTML = `
      <div class="card card-submitted-locked">
        <div style="font-size: 3rem; margin-bottom: 12px;">✅</div>
        <h2 style="color: var(--cyan); margin-bottom: 8px;">¡Respuesta Enviada con Éxito!</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">
          Su entrega fue registrada (Orden de entrega: <strong>#${groupData.submissionOrder || 1}</strong>).
        </p>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; text-align: left;">
          <strong style="color: #ffffff;">Resumen de su entrega (${isRed ? 'Red Team' : 'Blue Team'}):</strong>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">
            ${isRed ? `
              <div>• Historia y técnicas enviadas para evaluación docente.</div>
            ` : `
              <div>• Anomalías marcadas: <strong>${(groupData.submission?.anomalies || []).length} / 5</strong></div>
              <div>• Recomendaciones de defensa registradas.</div>
            `}
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-dim);">
          📺 Miren la pantalla de proyección para la <strong>Puesta en Común</strong> y el <strong>Podio Final</strong>.
        </p>
      </div>
    `;
  }

  // =========================================================================
  // 3. PVP MODE (Duelo Cruzado)
  // =========================================================================
  function renderPvPView() {
    materialContainer.innerHTML = '';
    const isRed = groupData.role === 'red';

    if (isRed) {
      if (groupData.status === 'submitted' || groupData.pvpPhase === 'waiting_defense' || groupData.pvpPhase === 'completed') {
        renderPvPRedWaiting();
      } else {
        renderPvPRedBuilder();
      }
    } else {
      if (groupData.receivedAttack && groupData.status !== 'submitted') {
        renderPvPBlueDetecting();
      } else if (groupData.status === 'submitted' || groupData.pvpPhase === 'completed') {
        renderPvPDefenseResult();
      } else {
        renderPvPBlueRadarWaiting();
      }
    }
  }

  function renderPvPRedBuilder() {
    const traps = sessionData.pvpTrapsCatalog || [];
    const draft = groupData.pvpAttackDraft || {};
    let currentIntent = draft.intentType || 'phishing';

    worksheetContainer.innerHTML = `
      <div class="card role-section-card team-card-red">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2 style="color: var(--red);">🛠️ Constructor Táctico (Red Team)</h2>
          <span class="pvp-badge-indicator">DUELO PvP</span>
        </div>

        <!-- 1. App Format Switcher -->
        <label class="form-label" style="color: #ffffff;">1. Seleccioná la App del Duelo:</label>
        <div class="app-tabs-container">
          <button type="button" class="app-tab-btn ${activeAppFormat === 'whatsapp' ? 'active' : ''}" data-format="whatsapp">
            💬 WhatsApp
          </button>
          <button type="button" class="app-tab-btn ${activeAppFormat === 'instagram' ? 'active' : ''}" data-format="instagram">
            📸 Instagram DM
          </button>
          <button type="button" class="app-tab-btn ${activeAppFormat === 'email' ? 'active' : ''}" data-format="email">
            📩 Correo Web
          </button>
        </div>

        <!-- 2. Strategy Selector -->
        <div style="margin-bottom: 20px; background: rgba(0,0,0,0.35); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <strong style="color: #ffffff; font-size: 0.95rem;">2. Estrategia de su Mensaje:</strong>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
            <button type="button" id="btnStrategyPhishing" class="btn-verdict ${currentIntent === 'phishing' ? 'btn-verdict-click selected' : 'btn-verdict-click'}">
              🔴 ATAQUE DE PHISHING<br>
              <span style="font-size: 0.72rem; font-weight: normal;">(Sembrar trampas para que caigan)</span>
            </button>
            <button type="button" id="btnStrategyLegit" class="btn-verdict ${currentIntent === 'legitimate' ? 'btn-verdict-block selected' : 'btn-verdict-block'}">
              🟢 SEÑUELO 100% LEGÍTIMO<br>
              <span style="font-size: 0.72rem; font-weight: normal;">(Mensaje oficial seguro)</span>
            </button>
          </div>
        </div>

        <!-- Guided Tips -->
        <div id="tacticalGuideBox" style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 14px; margin-bottom: 20px; border-left: 4px solid ${currentIntent === 'phishing' ? 'var(--red)' : 'var(--green)'};">
          ${renderTacticalGuide(currentIntent, activeAppFormat)}
        </div>

        <!-- Dynamic Form Fields -->
        <form id="pvpRedForm">
          <div id="dynamicAppFieldsContainer">
            ${renderAppSpecificFields(activeAppFormat, draft, currentIntent)}
          </div>

          <div id="trapsHiddenSection" style="display: ${currentIntent === 'phishing' ? 'block' : 'none'};">
            <h3 style="color: var(--yellow); margin: 24px 0 8px 0;">🎯 Trampas Sembradas en su Mensaje:</h3>
            <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 12px;">Marquen las técnicas que ocultaron en el mensaje:</p>

            <div class="anomalies-selection-grid" id="pvpTrapsGrid">
              ${traps.map(trap => `
                <div class="anomaly-check-card selected" data-id="${trap.id}">
                  <input type="checkbox" class="anomaly-checkbox" checked tabindex="-1">
                  <div>
                    <span class="badge badge-yellow" style="font-size: 0.7rem; margin-bottom: 2px;">${trap.code}</span>
                    <div style="font-weight: bold;">${trap.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${trap.description}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <button type="button" id="btnFireAttack" class="btn btn-red btn-lg" style="width: 100%; margin-top: 24px;">
            ⚡ Disparar al Blue Team Rival
          </button>
        </form>
      </div>
    `;

    // Strategy toggles
    document.getElementById('btnStrategyPhishing').addEventListener('click', () => {
      currentIntent = 'phishing';
      document.getElementById('btnStrategyPhishing').classList.add('selected');
      document.getElementById('btnStrategyLegit').classList.remove('selected');
      document.getElementById('trapsHiddenSection').style.display = 'block';
      document.getElementById('tacticalGuideBox').innerHTML = renderTacticalGuide('phishing', activeAppFormat);
      document.getElementById('tacticalGuideBox').style.borderLeftColor = 'var(--red)';
    });

    document.getElementById('btnStrategyLegit').addEventListener('click', () => {
      currentIntent = 'legitimate';
      document.getElementById('btnStrategyLegit').classList.add('selected');
      document.getElementById('btnStrategyPhishing').classList.remove('selected');
      document.getElementById('trapsHiddenSection').style.display = 'none';
      document.getElementById('tacticalGuideBox').innerHTML = renderTacticalGuide('legitimate', activeAppFormat);
      document.getElementById('tacticalGuideBox').style.borderLeftColor = 'var(--green)';
    });

    // App Format Switchers
    worksheetContainer.querySelectorAll('.app-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeAppFormat = btn.dataset.format;
        renderPvPRedBuilder();
      });
    });

    // Trap cards toggle
    worksheetContainer.querySelectorAll('#pvpTrapsGrid .anomaly-check-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        const cb = card.querySelector('.anomaly-checkbox');
        if (cb) cb.checked = card.classList.contains('selected');
      });
    });

    document.getElementById('btnFireAttack').addEventListener('click', () => {
      openSubmitConfirm();
    });
  }

  function renderTacticalGuide(intent, appType) {
    if (intent === 'phishing') {
      return `
        <div style="font-size: 0.85rem;">
          <strong style="color: var(--red);">🎯 Guía Táctica: Ataque de Phishing</strong>
          <p style="color: var(--text-dim); margin-top: 4px;">
            Siembran trampas indetectables: urgencia de tiempo, errores tipográficos sutiles o enlaces fraudulentos (.xyz, .free.nf).
          </p>
        </div>
      `;
    } else {
      return `
        <div style="font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--green);">🟢 Guía Táctica: Señuelo Legítimo</strong>
            <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem;" onclick="applyLegitTemplate('${appType}')">
              ✨ Cargar Plantilla Oficial
            </button>
          </div>
          <p style="color: var(--text-dim); margin-top: 4px;">
            Diseñen un mensaje 100% seguro (usando dominios oficiales como .edu.ar o .gob.ar).
          </p>
        </div>
      `;
    }
  }

  window.applyLegitTemplate = function(appType) {
    if (appType === 'whatsapp') {
      const name = document.getElementById('waContactName');
      const num = document.getElementById('waContactNumber');
      const msg = document.getElementById('waMessage');
      const link = document.getElementById('waLink');
      if (name) name.value = 'Dirección Escolar Oficial';
      if (num) num.value = '+54 11 4321-8800';
      if (msg) msg.value = 'Estimada comunidad educativa: Les recordamos que las clases presenciales continúan en su horario habitual.';
      if (link) link.value = 'https://colegio.edu.ar/calendario';
    } else if (appType === 'instagram') {
      const u = document.getElementById('igUsername');
      const bio = document.getElementById('igBio');
      const msg = document.getElementById('igMessage');
      const link = document.getElementById('igLink');
      if (u) u.value = 'colegio_oficial_comunidad';
      if (bio) bio.value = 'Cuenta oficial del colegio. 420 publicaciones · 3.4k seguidores';
      if (msg) msg.value = '¡Hola! Les compartimos el enlace al anuario escolar digital.';
      if (link) link.value = 'https://colegio.edu.ar/anuario';
    } else {
      const sender = document.getElementById('pvpSender');
      const email = document.getElementById('pvpEmail');
      const subj = document.getElementById('pvpSubject');
      const body = document.getElementById('pvpBody');
      const link = document.getElementById('pvpLink');
      if (sender) sender.value = 'Dirección Escolar';
      if (email) email.value = 'comunicados@colegio.edu.ar';
      if (subj) subj.value = 'Comunicado Oficial: Calendario de Exámenes 2026';
      if (body) body.value = 'Se informa que el cronograma de exámenes se encuentra disponible en la web oficial del colegio.';
      if (link) link.value = 'https://colegio.edu.ar/examenes';
    }
  };

  function renderAppSpecificFields(appType, draft, currentIntent) {
    if (appType === 'instagram') {
      return `
        <div class="form-group">
          <label class="form-label" style="color: #e1306c;">👤 Usuario de Instagram (@)</label>
          <input type="text" id="igUsername" class="form-control" placeholder="ej: duki_oficiall_sorteos" value="${draft.username || ''}">
        </div>
        <div class="form-group">
          <label class="form-label" style="color: #e1306c;">📝 Biografía del Perfil y Seguidores</label>
          <input type="text" id="igBio" class="form-control" placeholder="ej: 🎟️ Sorteos oficiales. 2 posts · 14 seguidores" value="${draft.bio || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">💬 Mensaje Directo (DM)</label>
          <textarea id="igMessage" class="form-control" rows="3" placeholder="Redacten el mensaje privado de Instagram...">${draft.message || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">🔗 Enlace Compartido en el DM</label>
          <input type="text" id="igLink" class="form-control" placeholder="ej: https://entradas-sorteo.free.nf/reclamar" value="${draft.linkUrl || ''}">
        </div>
      `;
    } else if (appType === 'whatsapp') {
      return `
        <div class="form-group">
          <label class="form-label" style="color: #25d366;">📱 Nombre del Contacto</label>
          <input type="text" id="waContactName" class="form-control" placeholder="ej: Beca Estudiantil 2026" value="${draft.contactName || draft.fromName || ''}">
        </div>
        <div class="form-group">
          <label class="form-label" style="color: #25d366;">📞 Número de Teléfono</label>
          <input type="text" id="waContactNumber" class="form-control" placeholder="ej: +54 9 11 9876-5432" value="${draft.contactNumber || draft.fromEmail || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">💬 Mensaje de Chat</label>
          <textarea id="waMessage" class="form-control" rows="3" placeholder="Escriban el mensaje de WhatsApp...">${draft.message || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">🔗 Enlace en el Mensaje</label>
          <input type="text" id="waLink" class="form-control" placeholder="ej: https://becas-estudiantes.free.nf/activar" value="${draft.linkUrl || ''}">
        </div>
      `;
    } else {
      return `
        <div class="form-group">
          <label class="form-label">👤 Nombre del Remitente</label>
          <input type="text" id="pvpSender" class="form-control" placeholder="ej: Banco de la Nación" value="${draft.fromName || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">📧 Dirección de Correo</label>
          <input type="text" id="pvpEmail" class="form-control" placeholder="ej: alerta@banconac1on.com" value="${draft.fromEmail || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">📌 Asunto del Correo</label>
          <input type="text" id="pvpSubject" class="form-control" placeholder="ej: ⚠️ URGENTE: Bloqueo de cuenta" value="${draft.subject || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">📝 Cuerpo del Correo</label>
          <textarea id="pvpBody" class="form-control" rows="3" placeholder="Redacten el texto...">${draft.message || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">🔗 Enlace del Botón</label>
          <input type="text" id="pvpLink" class="form-control" placeholder="ej: https://seguridad-banco.xyz/login" value="${draft.linkUrl || ''}">
        </div>
      `;
    }
  }

  function collectAppPayload(appType, intentType) {
    const isPhishing = intentType === 'phishing';
    const trapsHidden = isPhishing
      ? Array.from(worksheetContainer.querySelectorAll('#pvpTrapsGrid .anomaly-check-card.selected')).map(c => c.dataset.id)
      : [];

    if (appType === 'instagram') {
      return {
        appType: 'instagram',
        intentType,
        username: document.getElementById('igUsername')?.value || 'instagram_user',
        bio: document.getElementById('igBio')?.value || 'Bio de Instagram',
        message: document.getElementById('igMessage')?.value || 'Mensaje de DM',
        linkUrl: document.getElementById('igLink')?.value || '',
        trapsHidden
      };
    } else if (appType === 'whatsapp') {
      return {
        appType: 'whatsapp',
        intentType,
        contactName: document.getElementById('waContactName')?.value || 'Contacto WhatsApp',
        contactNumber: document.getElementById('waContactNumber')?.value || '+54 9 11 0000-0000',
        message: document.getElementById('waMessage')?.value || 'Mensaje de WhatsApp',
        linkUrl: document.getElementById('waLink')?.value || '',
        trapsHidden
      };
    } else {
      return {
        appType: 'email',
        intentType,
        fromName: document.getElementById('pvpSender')?.value || 'Remitente',
        fromEmail: document.getElementById('pvpEmail')?.value || 'alerta@correo.com',
        subject: document.getElementById('pvpSubject')?.value || 'Aviso Urgente',
        message: document.getElementById('pvpBody')?.value || 'Texto del correo',
        linkUrl: document.getElementById('pvpLink')?.value || '',
        trapsHidden
      };
    }
  }

  function renderPvPRedWaiting() {
    worksheetContainer.innerHTML = `
      <div class="card card-submitted-locked">
        <div style="font-size: 3rem; margin-bottom: 12px;">🚀</div>
        <h2 style="color: var(--red); margin-bottom: 8px;">¡Ataque Disparado con Éxito!</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">
          Su mensaje ya apareció en el teléfono del <strong>Blue Team rival</strong>.
        </p>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; text-align: left;">
          <strong style="color: #ffffff;">Estado del Duelo:</strong>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">
            📡 Esperando a que el Blue Team analice las señales y emita su veredicto de defensa.
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-dim);">
          📺 Observen la <strong>pantalla gigante</strong> para la resolución del duelo en vivo.
        </p>
      </div>
    `;
  }

  function renderPvPBlueRadarWaiting() {
    worksheetContainer.innerHTML = `
      <div class="card card-radar-waiting">
        <div class="radar-scan-anim">📡</div>
        <h2 style="color: var(--cyan); margin-bottom: 8px;">Radar Forense a la Espera</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px;">
          El <strong>Red Team atacante</strong> está diseñando su mensaje en tiempo real.
        </p>
        <p style="font-size: 0.85rem; color: var(--text-dim);">
          Mantengan esta pantalla abierta. El mensaje entrante aparecerá automáticamente en cuanto sea disparado.
        </p>
      </div>
    `;
  }

  function renderPvPBlueDetecting() {
    const attack = groupData.receivedAttack || {};
    const appType = attack.appType || (attack.username ? 'instagram' : (attack.contactNumber ? 'whatsapp' : 'email'));
    const traps = sessionData.pvpTrapsCatalog || [];

    worksheetContainer.innerHTML = `
      <div class="card role-section-card team-card-blue">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
          <span style="font-size: 2rem;">${appType === 'instagram' ? '📸' : (appType === 'whatsapp' ? '💬' : '📬')}</span>
          <div>
            <strong style="font-size: 1.1rem; color: #ffffff;">MENSAJE ENTRANTE DE ${appType.toUpperCase()}</strong>
            <div style="font-size: 0.78rem; color: var(--yellow);">⚠️ ALERTA DE SEGURIDAD: Inspección forense requerida</div>
          </div>
        </div>

        <!-- Realistic Inspection Simulation -->
        <div style="margin-bottom: 20px;">
          ${CaseViewer.render(attack, appType)}
        </div>

        <!-- Blue Defense Form -->
        <form id="pvpDefenseForm">
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.3); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <strong style="color: #ffffff; font-size: 0.95rem;">1. ¿Cuál es su veredicto?</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
              <button type="button" id="btnVerdictBlock" class="btn-verdict btn-verdict-block">
                🛡️ ES UN ENGAÑO / PHISHING<br>
                <span style="font-size: 0.72rem; font-weight: normal;">(Bloquear y Reportar)</span>
              </button>
              <button type="button" id="btnVerdictClick" class="btn-verdict btn-verdict-click">
                🟢 ES 100% SEGURO Y LEGÍTIMO<br>
                <span style="font-size: 0.72rem; font-weight: normal;">(Abrir enlace / Confiar)</span>
              </button>
            </div>
          </div>

          <div id="blueTrapsContainer" style="margin-bottom: 20px;">
            <label class="form-label">2. Si sospechan de engaño, ¿qué señales forenses detectaron?</label>
            <div class="anomalies-selection-grid" id="blueDetectedTrapsGrid">
              ${traps.map(trap => `
                <div class="anomaly-check-card" data-id="${trap.id}">
                  <input type="checkbox" class="anomaly-checkbox" tabindex="-1">
                  <div>
                    <span class="badge badge-cyan" style="font-size: 0.7rem; margin-bottom: 2px;">${trap.code}</span>
                    <div style="font-weight: bold;">${trap.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${trap.description}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">3. Justificación Forense (¿Por qué tomaron esa decisión?)</label>
            <textarea id="bluePvPRec" class="form-control" rows="2" placeholder="Ej: La cuenta de Instagram tiene letras repetidas y el enlace .free.nf es sospechoso..."></textarea>
          </div>

          <button type="button" id="btnSubmitDefense" class="btn btn-cyan btn-lg" style="width: 100%; margin-top: 14px;">
            🛡️ Enviar Veredicto de Defensa
          </button>
        </form>
      </div>
    `;

    let currentVerdict = '';
    const btnBlock = document.getElementById('btnVerdictBlock');
    const btnClick = document.getElementById('btnVerdictClick');

    btnBlock.addEventListener('click', () => {
      currentVerdict = 'phishing';
      btnBlock.classList.add('selected');
      btnClick.classList.remove('selected');
      document.getElementById('blueTrapsContainer').style.display = 'block';
    });

    btnClick.addEventListener('click', () => {
      currentVerdict = 'legitimate';
      btnClick.classList.add('selected');
      btnBlock.classList.remove('selected');
      document.getElementById('blueTrapsContainer').style.display = 'none';
    });

    worksheetContainer.querySelectorAll('#blueDetectedTrapsGrid .anomaly-check-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        const cb = card.querySelector('.anomaly-checkbox');
        if (cb) cb.checked = card.classList.contains('selected');
      });
    });

    document.getElementById('btnSubmitDefense').addEventListener('click', () => {
      if (!currentVerdict) {
        alert('Por favor seleccionen un veredicto (Es un engaño o Es legítimo).');
        return;
      }
      openSubmitConfirm();
    });
  }

  function renderPvPDefenseResult(match) {
    const defense = groupData.pvpDefenseResult || (match ? match.defenseResult : null) || {};

    worksheetContainer.innerHTML = `
      <div class="card card-submitted-locked">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛡️</div>
        <h2 style="color: var(--blue); margin-bottom: 8px;">¡Veredicto de Defensa Registrado!</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px;">
          Su análisis fue enviado a la central forense de CSI Digital.
        </p>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; text-align: left;">
          <strong style="color: #ffffff;">Veredicto Emitido:</strong>
          <div style="font-size: 0.95rem; font-weight: bold; color: ${defense.verdict === 'phishing' ? 'var(--red)' : 'var(--green)'}; margin-top: 4px;">
            ${defense.verdict === 'phishing' ? '🛡️ Ataque de Phishing / Bloqueado' : '🟢 Comunicación Oficial / Confiable'}
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-dim);">
          📺 Miren la <strong>pantalla gigante</strong> para la resolución del duelo en vivo.
        </p>
      </div>
    `;
  }

  // =========================================================================
  // SUBMISSION CONFIRMATION
  // =========================================================================
  function openSubmitConfirm() {
    if (submitConfirmModal) {
      submitConfirmModal.classList.add('active');
    }
  }

  if (btnCancelSubmit) {
    btnCancelSubmit.addEventListener('click', () => {
      if (submitConfirmModal) submitConfirmModal.classList.remove('active');
    });
  }

  if (btnConfirmSubmit) {
    btnConfirmSubmit.addEventListener('click', () => {
      btnConfirmSubmit.disabled = true;
      btnConfirmSubmit.innerText = 'Enviando...';

      if (sessionData.mode === 'builder') {
        socket.emit('builder:submitChoices', {
          code: currentSessionCode,
          participantId: participantData.id,
          choices: builderChoices
        });
      } else if (sessionData.mode === 'pvp') {
        if (groupData.role === 'red') {
          const intentType = document.getElementById('btnStrategyPhishing')?.classList.contains('selected') ? 'phishing' : 'legitimate';
          const payload = collectAppPayload(activeAppFormat, intentType);
          socket.emit('pvp:submitAttack', { code: currentSessionCode, groupId: currentGroupId, attackPayload: payload });
        } else {
          const verdict = document.getElementById('btnVerdictBlock')?.classList.contains('selected') ? 'phishing' : 'legitimate';
          const detectedTraps = Array.from(worksheetContainer.querySelectorAll('#blueDetectedTrapsGrid .anomaly-check-card.selected')).map(c => c.dataset.id);
          const rec = document.getElementById('bluePvPRec')?.value || '';
          socket.emit('pvp:submitDefense', {
            code: currentSessionCode,
            groupId: currentGroupId,
            defensePayload: { verdict, detectedTraps, recommendations: [rec] }
          });
        }
      } else {
        if (groupData.role === 'red') {
          const submission = {
            fields: {
              story: document.getElementById('redStory')?.value || '',
              urgency: document.getElementById('redUrgency')?.value || '',
              technical: document.getElementById('redTechnical')?.value || ''
            }
          };
          socket.emit('response:submit', { code: currentSessionCode, groupId: currentGroupId, submission });
        } else {
          const selectedAnoms = Array.from(worksheetContainer.querySelectorAll('.anomaly-check-card.selected')).map(c => c.dataset.id);
          const recs = [
            document.getElementById('rec1')?.value || '',
            document.getElementById('rec2')?.value || '',
            document.getElementById('rec3')?.value || ''
          ];
          const submission = { anomalies: selectedAnoms, recommendations: recs };
          socket.emit('response:submit', { code: currentSessionCode, groupId: currentGroupId, submission });
        }
      }

      setTimeout(() => {
        btnConfirmSubmit.disabled = false;
        btnConfirmSubmit.innerText = 'Sí, Enviar Respuesta';
      }, 1200);
    });
  }
});
