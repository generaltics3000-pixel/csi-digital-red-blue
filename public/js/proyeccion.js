/**
 * CSI Digital - Red Team vs Blue Team: Projector Screen Logic
 * Modos soportados:
 * 1. Caso Guiado (Guided Mode)
 * 2. Duelo Cruzado PvP (PvP Mode con Instagram, WhatsApp & Correo)
 * 3. Laboratorio / Armador de Mensajes (Builder Mode individual con galería y podio)
 */

document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // State
  let sessionData = null;
  let currentMode = 'lobby';

  // DOM Elements
  const stage = document.getElementById('projStage');
  const projCodeDisplay = document.getElementById('projCodeDisplay');
  const projModePill = document.getElementById('projModePill');
  const confettiCanvas = document.getElementById('confettiCanvas');

  const urlParams = new URLSearchParams(window.location.search);
  let sessionCode = urlParams.get('code');

  if (!sessionCode) {
    sessionCode = prompt('Ingresá el código de sesión para la pantalla de proyección (Ej: CSI-1234):');
  }

  if (sessionCode) {
    sessionCode = sessionCode.toUpperCase().trim();
    projCodeDisplay.innerText = sessionCode;
    socket.emit('join:projection', { code: sessionCode });
  }

  // Socket Events
  socket.on('error', (err) => {
    stage.innerHTML = `<div class="card" style="text-align: center; color: var(--red);"><h2>⚠️ Error: ${err.message}</h2></div>`;
  });

  socket.on('session:update', (session) => {
    sessionData = session;
    projCodeDisplay.innerText = session.code;
    renderCurrentMode();
  });

  socket.on('timer:tick', ({ remainingSeconds }) => {
    if (sessionData && sessionData.timer) {
      sessionData.timer.remainingSeconds = remainingSeconds;
    }
    const giantTimerEl = document.getElementById('giantTimer');
    if (giantTimerEl) {
      giantTimerEl.innerText = formatTime(remainingSeconds);
      if (remainingSeconds <= 60 && remainingSeconds > 0) {
        giantTimerEl.className = 'proj-giant-timer timer-danger';
      } else {
        giantTimerEl.className = 'proj-giant-timer';
      }
    }
  });

  socket.on('timer:warning', ({ minutesLeft }) => {
    window.soundEngine.playTimerWarning();
  });

  socket.on('timer:expired', () => {
    if (sessionData && sessionData.timer) sessionData.timer.remainingSeconds = 0;
    const giantTimerEl = document.getElementById('giantTimer');
    if (giantTimerEl) {
      giantTimerEl.innerText = '00:00';
      giantTimerEl.className = 'proj-giant-timer timer-danger';
    }
  });

  socket.on('projection:modeChanged', ({ mode, activePvPMatchIndex, activeReviewGroupId, extraData }) => {
    currentMode = mode;
    if (sessionData) {
      sessionData.projectionMode = mode;
      if (activePvPMatchIndex !== undefined) sessionData.activePvPMatchIndex = activePvPMatchIndex;
      if (activeReviewGroupId !== undefined) sessionData.activeReviewGroupId = activeReviewGroupId;
    }
    renderCurrentMode();

    if (mode === 'revelation' || mode === 'review') {
      window.soundEngine.playReveal();
    } else if (mode === 'ranking') {
      window.soundEngine.playVictoryFanfare();
      triggerConfetti();
    }
  });

  function formatTime(totalSecs) {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderCurrentMode() {
    if (!sessionData) return;
    const mode = sessionData.projectionMode || 'lobby';
    currentMode = mode;
    const isPvP = sessionData.mode === 'pvp';
    const isBuilder = sessionData.mode === 'builder';

    switch (mode) {
      case 'lobby':
        if (isBuilder) projModePill.innerText = '🛠️ LOBBY: LABORATORIO DE ARMADO';
        else if (isPvP) projModePill.innerText = '⚔️ LOBBY: DUELO CRUZADO PvP';
        else projModePill.innerText = '📽️ MODO LOBBY';
        renderLobbyMode();
        break;

      case 'playing':
        if (isBuilder) projModePill.innerText = '🛠️ ARMADO EN CURSO';
        else if (isPvP) projModePill.innerText = '⚔️ DUELO EN CURSO';
        else projModePill.innerText = '⏱️ EN JUEGO';
        renderPlayingMode();
        break;

      case 'review':
        if (isBuilder) {
          projModePill.innerText = '🗣️ GALERÍA DE CREACIONES';
          renderBuilderGalleryStage();
        } else if (isPvP) {
          projModePill.innerText = '⚔️ DUELO CARA A CARA';
          renderPvPDuelStage();
        } else {
          projModePill.innerText = '🗣️ PUESTA EN COMÚN';
          renderReviewMode();
        }
        break;

      case 'revelation':
        if (isBuilder) {
          projModePill.innerText = '🗣️ GALERÍA DE CREACIONES';
          renderBuilderGalleryStage();
        } else if (isPvP) {
          projModePill.innerText = '⚔️ DUELO CARA A CARA';
          renderPvPDuelStage();
        } else {
          projModePill.innerText = '🔍 REVELACIÓN DE ANOMALÍAS';
          renderRevelationMode();
        }
        break;

      case 'ranking':
        projModePill.innerText = '🏆 RANKING FINAL';
        renderRankingMode();
        break;

      default:
        renderLobbyMode();
    }
  }

  // 1. LOBBY MODE
  function renderLobbyMode() {
    const joinUrl = window.location.origin;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl + '/?code=' + sessionData.code)}`;
    const isPvP = sessionData.mode === 'pvp';
    const isBuilder = sessionData.mode === 'builder';

    let rightPanelHtml = '';

    if (isBuilder) {
      const participants = sessionData.builderParticipants || [];
      const scenario = sessionData.builderScenario;
      const objText = sessionData.builderObjective === 'phishing' ? '🎣 Ataque de Phishing' : '🟢 Comunicación Segura y Legítima';
      const objColor = sessionData.builderObjective === 'phishing' ? 'var(--red)' : 'var(--green)';

      rightPanelHtml = `
        <div>
          <div style="background: rgba(0,0,0,0.35); padding: 14px 18px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 16px;">
            <div style="font-size: 0.85rem; color: var(--text-dim); text-transform: uppercase; font-weight: bold;">Misión del Laboratorio:</div>
            <h3 style="color: var(--yellow); margin: 4px 0 8px 0; font-size: 1.25rem;">${scenario?.title || 'Armá tu Mensaje'}</h3>
            <div style="font-size: 0.95rem; color: #ffffff;">
              Objetivo asignado: <strong style="color: ${objColor};">${objText}</strong>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.15rem; color: #ffffff;">Alumnos Conectados (${participants.length})</h3>
            <span class="badge badge-yellow">${participants.length} listos para armar</span>
          </div>

          <div class="lobby-groups-container" style="max-height: 380px; overflow-y: auto;">
            ${participants.length === 0 ? `
              <div style="text-align: center; padding: 30px; color: var(--text-dim);">
                <div style="font-size: 2rem; margin-bottom: 6px;">📱</div>
                Escaneen el código QR o ingresen a ${joinUrl} para entrar con su nombre.
              </div>
            ` : participants.map(p => `
              <div class="lobby-group-tile connected" style="padding: 12px 16px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 1.2rem;">👤</span>
                  <strong style="color: #ffffff; font-size: 1.05rem;">${p.alias}</strong>
                </div>
                <span style="color: var(--green); font-size: 0.9rem; font-weight: bold;">● Conectado</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (isPvP && sessionData.pvpMatches) {
      rightPanelHtml = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.3rem; color: #ffffff;">⚔️ Duelos Programados (Red vs Blue)</h3>
            <span class="badge badge-red">${sessionData.pvpMatches.length} Duelos Cara a Cara</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${sessionData.pvpMatches.map(m => `
              <div class="lobby-group-tile connected" style="padding: 14px 18px;">
                <div>
                  <strong style="color: var(--cyan);">Duelo #${m.matchId}:</strong>
                  <span class="badge badge-red" style="margin: 0 6px;">${m.redGroupName} (Red)</span>
                  <span style="color: var(--text-dim);">VS</span>
                  <span class="badge badge-blue" style="margin: 0 6px;">${m.blueGroupName} (Blue)</span>
                </div>
                <div>
                  <span style="color: var(--green); font-size: 0.85rem; font-weight: bold;">● Listo</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      const groups = sessionData.groups || [];
      rightPanelHtml = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.3rem; color: #ffffff;">Equipos en la Sala</h3>
            <span class="badge badge-cyan">${groups.filter(g => g.status !== 'disconnected').length} de ${groups.length} conectados</span>
          </div>

          <div class="lobby-groups-container">
            ${groups.map(g => {
              const isConnected = g.status !== 'disconnected';
              const isRed = g.role === 'red';
              return `
                <div class="lobby-group-tile ${isConnected ? 'connected' : ''}">
                  <div>
                    <strong style="font-size: 1.1rem; color: #ffffff;">${g.name}</strong>
                    <div style="margin-top: 4px;">
                      <span class="badge ${isRed ? 'badge-red' : 'badge-blue'}">${isRed ? 'RED TEAM' : 'BLUE TEAM'}</span>
                    </div>
                  </div>
                  <div>
                    ${isConnected ? '<span style="color: var(--green); font-weight: bold; font-size: 1.1rem;">● Listo</span>' : '<span style="color: var(--text-dim);">○ Esperando</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    stage.innerHTML = `
      <div class="lobby-layout-grid">
        <div class="lobby-qr-card">
          <h2 style="font-size: 1.6rem; color: #ffffff; margin-bottom: 6px;">Unirse con el Celular</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Escaneen el código QR o ingresen desde el navegador:</p>
          <img src="${qrUrl}" alt="QR de Acceso" class="lobby-qr-img">
          <div style="font-size: 1rem; color: var(--text-muted); margin-top: 6px;">URL: <strong style="color: var(--cyan);">${joinUrl}</strong></div>
          <div class="lobby-code-display">${sessionData.code}</div>
        </div>

        ${rightPanelHtml}
      </div>
    `;
  }

  // 2. PLAYING MODE
  function renderPlayingMode() {
    const remaining = sessionData.timer ? sessionData.timer.remainingSeconds : 0;
    const isPvP = sessionData.mode === 'pvp';
    const isBuilder = sessionData.mode === 'builder';

    let footerCardsHtml = '';

    if (isBuilder) {
      const participants = sessionData.builderParticipants || [];
      const submittedCount = participants.filter(p => p.submitted).length;

      footerCardsHtml = `
        <div style="margin-top: 20px; width: 100%; max-width: 900px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #ffffff;">Avance de Entregas:</strong>
            <span style="color: var(--yellow); font-weight: bold;">${submittedCount} de ${participants.length} entregados</span>
          </div>
          <div style="width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
            <div style="width: ${participants.length ? Math.round((submittedCount / participants.length) * 100) : 0}%; height: 100%; background: var(--yellow); transition: width 0.5s ease;"></div>
          </div>

          <div class="proj-status-cards-row">
            ${participants.map(p => `
              <div class="proj-group-mini-card ${p.submitted ? 'mini-submitted' : ''}">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 0.9rem;">${p.alias}</div>
                <div style="font-size: 0.78rem;">
                  ${p.submitted ? '✅ Entregado' : (p.status === 'typing' ? '✍️ Armando...' : '⌛ Conectado')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      const groups = sessionData.groups || [];
      footerCardsHtml = `
        <div class="proj-status-cards-row">
          ${groups.map(g => {
            const isRed = g.role === 'red';
            const isSub = g.status === 'submitted';
            return `
              <div class="proj-group-mini-card ${isSub ? 'mini-submitted' : ''}">
                <div style="font-weight: bold; margin-bottom: 4px;">${g.name}</div>
                <span class="badge ${isRed ? 'badge-red' : 'badge-blue'}" style="margin-bottom: 6px;">${isRed ? 'RED' : 'BLUE'}</span>
                <div style="font-size: 0.8rem;">
                  ${isSub ? '✅ Entregado' : (g.status === 'typing' ? '✍️ Trabajando' : '⌛ Conectado')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    stage.innerHTML = `
      <div class="playing-center-box">
        <div style="font-size: 1.1rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; margin-bottom: 6px;">
          ${isBuilder
            ? `🛠️ Laboratorio: ${sessionData.builderScenario?.title || 'Armador de Mensajes'}`
            : (isPvP ? `⚔️ Temática: ${sessionData.pvpTheme?.title || 'Duelo de Ciberseguridad'}` : `Caso: ${sessionData.caseData?.title || 'CSI Digital'}`)}
        </div>

        <div id="giantTimer" class="proj-giant-timer ${remaining <= 60 && remaining > 0 ? 'timer-danger' : ''}">
          ${formatTime(remaining)}
        </div>

        <div style="font-size: 1.1rem; color: var(--cyan); font-weight: bold;">
          ${isBuilder
            ? `🎯 Objetivo: ${sessionData.builderObjective === 'phishing' ? 'Crear el engaño de Phishing más convincente' : 'Crear una comunicación 100% auténtica y segura'}`
            : (isPvP ? '📡 Duelos en vivo: Creación de ataques (Instagram/WhatsApp/Email) vs Ciberdefensa' : '⏱️ Envíos en curso')}
        </div>

        ${footerCardsHtml}
      </div>
    `;
  }

  // 3. BUILDER GALLERY STAGE (For Builder Mode in Review)
  function renderBuilderGalleryStage() {
    const participants = sessionData.builderParticipants || [];
    if (participants.length === 0) {
      stage.innerHTML = `<div class="card" style="text-align: center; color: var(--text-muted);"><h2>No hay participantes registrados en este laboratorio.</h2></div>`;
      return;
    }

    const activeIdx = Math.min(sessionData.activeBuilderParticipantIndex || 0, participants.length - 1);
    const participant = participants[activeIdx] || participants[0];
    const scenario = sessionData.builderScenario;
    const appType = scenario?.appType || 'whatsapp';
    const choices = participant.choices || {};
    const feedback = participant.feedback;
    const score = participant.score || { percentage: 0, totalPoints: 0, maxPoints: 0 };

    const previewMaterial = assembleBuilderMaterial(scenario, choices);

    stage.innerHTML = `
      <div class="pvp-duel-container">
        <!-- Header -->
        <div class="pvp-duel-header">
          <div>
            <div style="font-size: 0.85rem; color: var(--text-dim); text-transform: uppercase;">
              Creación #${activeIdx + 1} de ${participants.length} · Formato: ${appType.toUpperCase()}
            </div>
            <h2 style="font-size: 1.6rem; color: var(--yellow); margin-top: 4px;">
              👤 Alumno(a): ${participant.alias}
            </h2>
          </div>

          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: var(--text-dim);">EFICACIA TÁCTICA</div>
              <div style="font-size: 1.4rem; font-weight: 900; color: var(--cyan); font-family: var(--font-mono);">
                ${score.percentage}% (${score.totalPoints}/${score.maxPoints} pts)
              </div>
            </div>
            <span class="badge ${score.percentage >= 80 ? 'badge-green' : (score.percentage >= 50 ? 'badge-yellow' : 'badge-red')}" style="font-size: 1rem; padding: 8px 14px;">
              ${score.percentage >= 80 ? '🏆 Excelente' : (score.percentage >= 50 ? '⭐ Aprobado' : '🔍 A Mejorar')}
            </span>
          </div>
        </div>

        <!-- 2-Column Split: Message Visual Mockup vs Pedagogical Feedback -->
        <div class="pvp-split-grid">
          <!-- Col 1: Realistic Rendered Message -->
          <div class="pvp-column red-column">
            <div class="pvp-col-title" style="color: var(--yellow);">
              📱 Mensaje Ensamblado por el Alumno:
            </div>
            <div style="margin-top: 10px;">
              ${CaseViewer.render(previewMaterial, appType)}
            </div>
          </div>

          <!-- Col 2: Feedback & Breakdown -->
          <div class="pvp-column blue-column">
            <div class="pvp-col-title" style="color: var(--cyan);">
              📊 Evaluación & Feedback Forense:
            </div>

            ${feedback?.overallMessage ? `
              <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.2); padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 0.95rem; color: #ffffff;">
                ${feedback.overallMessage}
              </div>
            ` : ''}

            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
              ${(feedback?.categoryScores || []).map(cat => `
                <div style="background: rgba(0,0,0,0.35); padding: 10px 14px; border-radius: 8px; border-left: 4px solid ${cat.rating === 'optimal' ? 'var(--green)' : (cat.rating === 'good' ? 'var(--yellow)' : 'var(--red)')};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <strong style="color: #ffffff; font-size: 0.92rem;">${cat.categoryIcon || '🧩'} ${cat.categoryLabel}:</strong>
                    <span class="badge ${cat.rating === 'optimal' ? 'badge-green' : (cat.rating === 'good' ? 'badge-yellow' : 'badge-red')}">${cat.points}/${cat.maxPoints} pts</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-dim); margin-bottom: 4px;">
                    Elegido: <em>"${cat.chosenOptionLabel}"</em>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted);">
                    ${cat.feedback}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. GUIDED REVIEW MODE
  function renderReviewMode() {
    const activeId = sessionData.activeReviewGroupId || 1;
    const group = (sessionData.groups || []).find(g => g.id === activeId) || sessionData.groups[0];
    if (!group) return;
    const isRed = group.role === 'red';
    const sub = group.submission || group.draft || {};

    let contentHtml = '';
    if (isRed) {
      const f = sub.fields || sub.redFields || {};
      contentHtml = `
        <div class="review-hero-card red-hero">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 1.6rem; color: var(--red);">🔴 ${group.name} — Red Team</h2>
            <span class="badge badge-red">Estrategia Atacante</span>
          </div>

          <div class="review-field-box">
            <div class="review-field-label">1. Historia / Pretexto para engañar a la víctima:</div>
            <div class="review-field-val">${f.story || 'Sin respuesta redactada.'}</div>
          </div>

          <div class="review-field-box">
            <div class="review-field-label">2. Gancho de Urgencia / Disparador Emocional:</div>
            <div class="review-field-val">${f.urgency || 'Sin respuesta redactada.'}</div>
          </div>

          <div class="review-field-box">
            <div class="review-field-label">3. Trampa Técnica (Enlace falso o archivo malicioso):</div>
            <div class="review-field-val">${f.technical || 'Sin respuesta redactada.'}</div>
          </div>
        </div>
      `;
    } else {
      const anoms = sub.anomalies || sub.blueAnomalies || [];
      const recs = sub.recommendations || sub.blueRecommendations || [];
      contentHtml = `
        <div class="review-hero-card blue-hero">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 1.6rem; color: var(--blue);">🔵 ${group.name} — Blue Team</h2>
            <span class="badge badge-blue">Detección Forense</span>
          </div>

          <div style="margin-bottom: 20px;">
            <div class="review-field-label">Anomalías Forenses Detectadas (${anoms.length}/5):</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
              ${anoms.map(a => `<span class="badge badge-cyan" style="font-size: 0.9rem; padding: 6px 12px;">✓ ${a}</span>`).join('')}
            </div>
          </div>

          <div class="review-field-box">
            <div class="review-field-label">Recomendaciones de Seguridad Redactadas:</div>
            <ul style="margin-top: 8px; padding-left: 20px; color: #ffffff;">
              ${recs.map(r => `<li>${r || '—'}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    stage.innerHTML = `
      <div style="max-width: 1000px; margin: 0 auto; width: 100%;">
        ${contentHtml}
      </div>
    `;
  }

  // 5. GUIDED REVELATION MODE
  function renderRevelationMode() {
    const caseData = sessionData.caseData;
    if (!caseData) return;

    stage.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.8rem; color: var(--cyan);">🔍 Revelación Forense de Anomalías</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Las 5 señales clave que delataban este ataque:</p>
          </div>
          <span class="badge badge-cyan" style="font-size: 1rem; padding: 8px 16px;">5 / 5 Señales</span>
        </div>

        <div style="margin-bottom: 24px;">
          ${CaseViewer.render(caseData.material, caseData.type, { revealMode: true, anomalies: caseData.anomalies })}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px;">
          ${(caseData.anomalies || []).map((anom, idx) => `
            <div style="background: rgba(0,0,0,0.35); padding: 14px; border-radius: 8px; border-left: 4px solid var(--cyan);">
              <strong style="color: var(--cyan);">#${idx + 1} — ${anom.title}</strong>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${anom.explanation}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 6. PVP DUEL STAGE
  function renderPvPDuelStage() {
    const matches = sessionData.pvpMatches || [];
    if (matches.length === 0) {
      stage.innerHTML = `<div class="card" style="text-align: center; color: var(--text-muted);"><h2>No hay duelos registrados.</h2></div>`;
      return;
    }

    const activeIdx = Math.min(sessionData.activePvPMatchIndex || 0, matches.length - 1);
    const match = matches[activeIdx] || matches[0];
    const attack = match.attackMaterial || {};
    const defense = match.defenseResult || {};
    const appType = attack.appType || (attack.username ? 'instagram' : (attack.contactNumber ? 'whatsapp' : 'email'));

    stage.innerHTML = `
      <div class="pvp-duel-container">
        <div class="pvp-duel-header">
          <div>
            <div style="font-size: 0.85rem; color: var(--text-dim); text-transform: uppercase;">
              Duelo #${match.matchId} de ${matches.length} · Formato: ${appType.toUpperCase()}
            </div>
            <h2 style="font-size: 1.6rem; color: #ffffff; margin-top: 4px;">
              <span style="color: var(--red);">${match.redGroupName} (Red)</span> ⚔️ <span style="color: var(--blue);">${match.blueGroupName} (Blue)</span>
            </h2>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <span class="badge ${match.status === 'completed' ? 'badge-green' : 'badge-yellow'}">
              ${match.status === 'completed' ? '✓ Duelo Finalizado' : '⌛ En Curso'}
            </span>
          </div>
        </div>

        <div class="pvp-split-grid">
          <div class="pvp-column red-column">
            <div class="pvp-col-title" style="color: var(--red);">
              🔴 Ataque Diseñado por ${match.redGroupName}:
            </div>
            <div style="margin-top: 10px;">
              ${CaseViewer.render(attack, appType)}
            </div>
          </div>

          <div class="pvp-column blue-column">
            <div class="pvp-col-title" style="color: var(--blue);">
              🔵 Veredicto y Análisis de ${match.blueGroupName}:
            </div>

            <div style="margin: 14px 0;">
              <div style="font-size: 0.85rem; color: var(--text-dim);">VEREDICTO:</div>
              <div style="font-size: 1.15rem; font-weight: bold; color: ${defense.verdict === 'phishing' || defense.verdict === 'blocked' ? 'var(--green)' : 'var(--red)'};">
                ${defense.verdict === 'phishing' || defense.verdict === 'blocked' ? '🛡️ Ataque Bloqueado con Éxito' : (defense.verdict ? '⚠️ Cayeron en la Trampa' : 'A la espera')}
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <div style="font-size: 0.85rem; color: var(--text-dim);">TRAMPAS DETECTADAS:</div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                ${(defense.detectedTraps || []).length ? defense.detectedTraps.map(t => `<span class="badge badge-cyan">✓ ${t}</span>`).join('') : '<span style="color: var(--text-dim);">Ninguna marcada</span>'}
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.4); padding: 14px; border-radius: 8px;">
              <strong style="color: var(--cyan);">📝 Justificación / Recomendación:</strong>
              <p style="font-size: 0.88rem; color: #cbd5e1; margin-top: 6px;">
                ${(defense.recommendations && defense.recommendations[0]) || 'Sin justificación redactada.'}
              </p>
            </div>

            ${match.summary ? `
              <div class="pvp-verdict-banner" style="margin-top: 14px; background: rgba(0,240,255,0.1); border: 1px solid var(--cyan); padding: 10px; border-radius: 8px; font-weight: bold; text-align: center; color: var(--cyan);">
                ${match.summary}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 7. RANKING MODE
  function renderRankingMode() {
    const isBuilder = sessionData.mode === 'builder';
    const isPvP = sessionData.mode === 'pvp';

    let sorted = [];
    if (isBuilder) {
      sorted = [...(sessionData.builderParticipants || [])]
        .filter(p => p.submitted)
        .sort((a, b) => (b.score?.percentage || 0) - (a.score?.percentage || 0));
    } else {
      sorted = [...(sessionData.groups || [])]
        .sort((a, b) => (b.score?.totalPoints || 0) - (a.score?.totalPoints || 0));
    }

    const top1 = sorted[0];
    const top2 = sorted[1];
    const top3 = sorted[2];

    stage.innerHTML = `
      <div class="ranking-stage">
        <h2 style="font-size: 2.2rem; text-align: center; margin-bottom: 20px;" class="gradient-text-cyan">
          🏆 Posiciones Finales del Taller
        </h2>

        <!-- Podium Top 3 -->
        <div class="podium-container">
          ${top2 ? `
            <div class="podium-slot podium-2">
              <strong style="font-size: 1.1rem; color: #ffffff; margin-bottom: 4px;">${top2.name || top2.alias}</strong>
              <span class="badge ${isBuilder ? 'badge-yellow' : (top2.role === 'red' ? 'badge-red' : 'badge-blue')}">${isBuilder ? 'ALUMNO' : top2.role.toUpperCase()}</span>
              <span style="font-size: 1.1rem; font-weight: bold; color: var(--cyan); margin: 6px 0;">${isBuilder ? `${top2.score.percentage}%` : `${top2.score.totalPoints || 0} pts`}</span>
              <div class="podium-pillar">2</div>
            </div>
          ` : ''}

          ${top1 ? `
            <div class="podium-slot podium-1">
              <span style="font-size: 2rem;">👑</span>
              <strong style="font-size: 1.3rem; color: #ffd700; margin-bottom: 4px;">${top1.name || top1.alias}</strong>
              <span class="badge ${isBuilder ? 'badge-yellow' : (top1.role === 'red' ? 'badge-red' : 'badge-blue')}">${isBuilder ? 'ALUMNO' : top1.role.toUpperCase()}</span>
              <span style="font-size: 1.3rem; font-weight: 900; color: #ffd700; margin: 6px 0;">${isBuilder ? `${top1.score.percentage}% (${top1.score.totalPoints} pts)` : `${top1.score.totalPoints || 0} pts`}</span>
              <div class="podium-pillar">1</div>
            </div>
          ` : ''}

          ${top3 ? `
            <div class="podium-slot podium-3">
              <strong style="font-size: 1.1rem; color: #ffffff; margin-bottom: 4px;">${top3.name || top3.alias}</strong>
              <span class="badge ${isBuilder ? 'badge-yellow' : (top3.role === 'red' ? 'badge-red' : 'badge-blue')}">${isBuilder ? 'ALUMNO' : top3.role.toUpperCase()}</span>
              <span style="font-size: 1.1rem; font-weight: bold; color: var(--cyan); margin: 6px 0;">${isBuilder ? `${top3.score.percentage}%` : `${top3.score.totalPoints || 0} pts`}</span>
              <div class="podium-pillar">3</div>
            </div>
          ` : ''}
        </div>

        <!-- Leaderboard Table -->
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>${isBuilder ? 'Alumno' : 'Grupo'}</th>
              <th>${isBuilder ? 'Estado' : 'Rol'}</th>
              <th>${isBuilder ? 'Componentes Armados' : (isPvP ? 'Rendimiento en Duelos' : 'Aciertos / Evaluación')}</th>
              <th>${isBuilder ? 'Porcentaje / Puntos' : 'Puntaje Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((item, idx) => `
              <tr>
                <td><strong>#${idx + 1}</strong></td>
                <td><strong style="color: #ffffff;">${item.name || item.alias}</strong></td>
                <td>
                  ${isBuilder
                    ? '<span class="badge badge-green">Entregado</span>'
                    : `<span class="badge ${item.role === 'red' ? 'badge-red' : 'badge-blue'}">${item.role.toUpperCase()} TEAM</span>`}
                </td>
                <td>
                  ${isBuilder
                    ? `${Object.keys(item.choices || {}).length} componentes elegidos`
                    : (isPvP ? `Aciertos: ${item.score?.pvpHits || 0} | Burladas: ${item.score?.pvpMisses || 0}` : `${item.score?.correctCount || 0}/5 aciertos`)}
                </td>
                <td>
                  <strong style="font-size: 1.1rem; color: var(--cyan); font-family: var(--font-mono);">
                    ${isBuilder ? `${item.score?.percentage || 0}% (${item.score?.totalPoints || 0} pts)` : `${item.score?.totalPoints || 0} pts`}
                  </strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Helper to build material from choices
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

  // Embedded Canvas Confetti
  function triggerConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#00f0ff', '#ff3366', '#ffd700', '#00ff88', '#ffffff', '#3b82f6'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        velY: Math.random() * 4 + 2,
        velX: (Math.random() - 0.5) * 3,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }

    let frame = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      particles.forEach(p => {
        p.y += p.velY;
        p.x += p.velX;
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame++;
      if (frame < 300) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }
    renderConfetti();
  }
});
