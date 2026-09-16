const QRCode = require('qrcode');
const { defaultCases, pvpTrapsCatalog, pvpThemes, builderScenarios } = require('./defaultCases');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.customCases = [...defaultCases];
    this.timerIntervals = new Map();
    this.io = null;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  getAllCases() {
    return this.customCases;
  }

  getPvPThemes() {
    return pvpThemes;
  }

  getPvPTrapsCatalog() {
    return pvpTrapsCatalog;
  }

  getBuilderScenarios() {
    return builderScenarios;
  }

  getCaseById(caseId) {
    return this.customCases.find(c => c.id === caseId) || defaultCases[0];
  }

  addCustomCase(caseData) {
    const newCase = {
      ...caseData,
      id: caseData.id || `caso-custom-${Date.now()}`
    };
    this.customCases.push(newCase);
    return newCase;
  }

  generateSessionCode() {
    let code;
    let attempts = 0;
    do {
      const num = Math.floor(1000 + Math.random() * 9000);
      code = `CSI-${num}`;
      attempts++;
    } while (this.sessions.has(code) && attempts < 100);
    return code;
  }

  async createSession({
    mode = 'guided',
    caseId,
    pvpThemeId,
    builderScenarioId,
    builderObjective,
    groupCount = 4,
    studentCount = 20,
    durationMinutes = 15,
    roleAssignment = 'auto',
    baseUrl = ''
  }) {
    const code = this.generateSessionCode();
    const isPvP = mode === 'pvp';
    const isBuilder = mode === 'builder';
    const totalGroups = isBuilder ? 0 : Math.min(Math.max(parseInt(groupCount, 10) || 4, 2), 10);
    const durationMins = Math.min(Math.max(parseInt(durationMinutes, 10) || 15, 1), 60);

    const selectedCase = (!isPvP && !isBuilder) ? this.getCaseById(caseId) : null;
    const selectedTheme = isPvP
      ? (pvpThemes.find(t => t.id === pvpThemeId) || pvpThemes[0])
      : null;
    const selectedBuilderScenario = isBuilder
      ? (builderScenarios.find(s => s.id === builderScenarioId) || builderScenarios[0])
      : null;

    // Generate groups (only for guided/pvp)
    const groups = [];
    if (!isBuilder) {
      for (let i = 1; i <= totalGroups; i++) {
        let role = 'blue';
        if (roleAssignment === 'auto') {
          role = (i % 2 !== 0) ? 'red' : 'blue';
        } else if (roleAssignment === 'all-red') {
          role = 'red';
        } else if (roleAssignment === 'all-blue') {
          role = 'blue';
        } else {
          role = (i <= Math.ceil(totalGroups / 2)) ? 'red' : 'blue';
        }

        const defaultApp = selectedTheme?.appType || 'instagram';

        groups.push({
          id: i,
          name: `Grupo ${i}`,
          role: role,
          status: 'disconnected',
          clientSockets: [],
          lastActive: Date.now(),
          draft: {
            redFields: {},
            blueAnomalies: [],
            blueRecommendations: ['', '', '']
          },
          submission: null,
          submittedAt: null,
          submissionOrder: null,
          pvpPhase: isPvP ? (role === 'red' ? 'building' : 'radar_waiting') : null,
          pvpAttackDraft: isPvP && role === 'red' ? {
            appType: defaultApp,
            intentType: 'phishing',
            username: selectedTheme?.defaultUsername || 'recitales_argentina_oficiall',
            bio: selectedTheme?.defaultBio || 'Producción de eventos y sorteos. 3 publicaciones · 14 seguidores',
            fromName: selectedTheme?.defaultSender || selectedTheme?.defaultUsername || 'Dirección Escolar',
            fromEmail: selectedTheme?.defaultAddress || selectedTheme?.defaultPhone || 'alerta@colegio.edu.ar',
            subject: selectedTheme?.defaultSubject || 'Aviso Importante',
            message: selectedTheme?.defaultMessage || selectedTheme?.suggestedStory || '¡Hola! Te enviamos este mensaje para coordinar la entrega.',
            linkUrl: selectedTheme?.defaultLink || 'https://portal-acceso.free.nf/login',
            hasVoiceNote: selectedTheme?.hasVoiceNote || false,
            trapsHidden: selectedTheme?.suggestedTraps || ['trap_domain_spoof', 'trap_urgency_threat', 'trap_fake_link']
          } : null,
          receivedAttack: null,
          pvpDefenseResult: null,
          score: {
            anomaliesFound: [],
            correctCount: 0,
            penaltyCount: 0,
            basePoints: 0,
            speedBonus: 0,
            redPoints: 0,
            facilitatorStars: 0,
            facilitatorNotes: '',
            pvpHits: 0,
            pvpMisses: 0,
            pvpBonus: 0,
            totalPoints: 0
          }
        });
      }
    }

    // Generate PvP Matchmaking Pairs
    const pvpMatches = [];
    if (isPvP) {
      const redGroups = groups.filter(g => g.role === 'red');
      const blueGroups = groups.filter(g => g.role === 'blue');
      const matchCount = Math.max(redGroups.length, blueGroups.length);

      for (let m = 0; m < matchCount; m++) {
        const redG = redGroups[m % redGroups.length];
        const blueG = blueGroups[m % blueGroups.length];
        if (redG && blueG) {
          pvpMatches.push({
            matchId: m + 1,
            redGroupId: redG.id,
            redGroupName: redG.name,
            blueGroupId: blueG.id,
            blueGroupName: blueG.name,
            status: 'in_progress',
            attackMaterial: null,
            defenseResult: null,
            winner: null,
            summary: ''
          });
        }
      }
    }

    // Generate QR Code
    const joinUrl = baseUrl ? `${baseUrl}/?code=${code}` : `/?code=${code}`;
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(joinUrl, {
        margin: 2,
        width: 280,
        color: {
          dark: '#00f0ff',
          light: '#0a0e17'
        }
      });
    } catch (err) {
      console.error('Error generating QR:', err);
    }

    const session = {
      code,
      mode: isBuilder ? 'builder' : (isPvP ? 'pvp' : 'guided'),
      createdAt: new Date().toISOString(),
      caseId: selectedCase ? selectedCase.id : null,
      caseData: selectedCase,
      pvpTheme: selectedTheme,
      pvpTrapsCatalog,
      pvpMatches,
      activePvPMatchIndex: 0,
      totalGroups,
      durationMinutes: durationMins,
      timer: {
        totalSeconds: durationMins * 60,
        remainingSeconds: durationMins * 60,
        state: 'stopped'
      },
      phase: 'lobby',
      projectionMode: 'lobby',
      activeReviewGroupId: 1,
      submissionSequence: 0,
      groups,
      joinUrl,
      qrDataUrl,
      facilitatorConnected: false,
      // Builder-specific properties
      builderScenario: selectedBuilderScenario,
      builderObjective: isBuilder ? (builderObjective || 'phishing') : null,
      builderMaxStudents: isBuilder ? Math.min(Math.max(parseInt(studentCount, 10) || 20, 1), 40) : 0,
      builderParticipants: isBuilder ? [] : null
    };

    this.sessions.set(code, session);
    return session;
  }


  getSession(code) {
    if (!code) return null;
    return this.sessions.get(code.toUpperCase().trim()) || null;
  }

  registerGroupConnection(code, groupId, socketId) {
    const session = this.getSession(code);
    if (!session) return null;

    const group = session.groups.find(g => g.id === parseInt(groupId, 10));
    if (!group) return null;

    if (!group.clientSockets.includes(socketId)) {
      group.clientSockets.push(socketId);
    }
    if (group.status !== 'submitted') {
      group.status = 'connected';
    }
    group.lastActive = Date.now();

    this.broadcastSessionUpdate(code);
    return { session, group };
  }

  handleDisconnect(socketId) {
    // Handle builder mode disconnects
    this.handleBuilderDisconnect(socketId);

    for (const [code, session] of this.sessions.entries()) {
      let changed = false;
      session.groups.forEach(group => {
        const idx = group.clientSockets.indexOf(socketId);
        if (idx !== -1) {
          group.clientSockets.splice(idx, 1);
          changed = true;
          if (group.clientSockets.length === 0 && group.status !== 'submitted') {
            group.status = 'disconnected';
          }
        }
      });
      if (changed) {
        this.broadcastSessionUpdate(code);
      }
    }
  }

  // --- Timer Controls ---
  startTimer(code) {
    const session = this.getSession(code);
    if (!session) return null;

    if (session.phase === 'lobby') {
      session.phase = 'playing';
      session.projectionMode = 'playing';
    }

    session.timer.state = 'running';

    if (!this.timerIntervals.has(code)) {
      const interval = setInterval(() => {
        if (session.timer.state === 'running') {
          if (session.timer.remainingSeconds > 0) {
            session.timer.remainingSeconds -= 1;

            if (this.io) {
              this.io.to(code).emit('timer:tick', {
                remainingSeconds: session.timer.remainingSeconds,
                totalSeconds: session.timer.totalSeconds,
                state: session.timer.state
              });
            }

            if (session.timer.remainingSeconds === 120) {
              if (this.io) this.io.to(code).emit('timer:warning', { minutesLeft: 2 });
            } else if (session.timer.remainingSeconds === 60) {
              if (this.io) this.io.to(code).emit('timer:warning', { minutesLeft: 1 });
            }
          } else {
            session.timer.state = 'expired';
            this.stopTimerInterval(code);
            if (this.io) {
              this.io.to(code).emit('timer:expired');
              this.broadcastSessionUpdate(code);
            }
          }
        }
      }, 1000);

      this.timerIntervals.set(code, interval);
    }

    this.broadcastSessionUpdate(code);
    return session;
  }

  pauseTimer(code) {
    const session = this.getSession(code);
    if (!session) return null;

    session.timer.state = 'paused';
    this.broadcastSessionUpdate(code);
    return session;
  }

  resetTimer(code) {
    const session = this.getSession(code);
    if (!session) return null;

    this.stopTimerInterval(code);
    session.timer.remainingSeconds = session.timer.totalSeconds;
    session.timer.state = 'stopped';
    this.broadcastSessionUpdate(code);
    return session;
  }

  adjustTimer(code, deltaSeconds) {
    const session = this.getSession(code);
    if (!session) return null;

    session.timer.remainingSeconds = Math.max(0, session.timer.remainingSeconds + deltaSeconds);
    if (session.timer.remainingSeconds > session.timer.totalSeconds) {
      session.timer.totalSeconds = session.timer.remainingSeconds;
    }
    this.broadcastSessionUpdate(code);
    return session;
  }

  stopTimerInterval(code) {
    if (this.timerIntervals.has(code)) {
      clearInterval(this.timerIntervals.get(code));
      this.timerIntervals.delete(code);
    }
  }

  forceCloseSubmissions(code) {
    const session = this.getSession(code);
    if (!session) return null;

    session.timer.state = 'expired';
    session.timer.remainingSeconds = 0;
    this.stopTimerInterval(code);

    if (this.io) {
      this.io.to(code).emit('timer:expired');
    }
    this.broadcastSessionUpdate(code);
    return session;
  }

  // --- Guided Mode Submissions ---
  saveDraft(code, groupId, draftData) {
    const session = this.getSession(code);
    if (!session) return null;

    const group = session.groups.find(g => g.id === parseInt(groupId, 10));
    if (!group || group.status === 'submitted') return null;

    group.draft = { ...group.draft, ...draftData };
    group.status = 'typing';
    group.lastActive = Date.now();

    if (this.io) {
      this.io.to(`${code}-facilitator`).emit('group:draftUpdate', {
        groupId: group.id,
        draft: group.draft,
        status: group.status
      });
    }

    return group;
  }

  submitResponse(code, groupId, submissionData) {
    const session = this.getSession(code);
    if (!session) return null;

    const group = session.groups.find(g => g.id === parseInt(groupId, 10));
    if (!group) return null;

    if (group.status === 'submitted') {
      return { success: false, message: 'La respuesta ya fue enviada previamente.' };
    }

    session.submissionSequence += 1;
    group.submissionOrder = session.submissionSequence;
    group.submittedAt = new Date().toISOString();
    group.status = 'submitted';
    group.submission = submissionData;

    this.calculateScore(session, group, submissionData);
    this.broadcastSessionUpdate(code);

    if (this.io) {
      this.io.to(code).emit('group:submitted', {
        groupId: group.id,
        groupName: group.name,
        role: group.role,
        order: group.submissionOrder
      });
    }

    return { success: true, group };
  }

  calculateScore(session, group, submission) {
    if (!session.caseData) return;
    const caseData = session.caseData;
    const correctAnomalies = caseData.anomalies.filter(a => a.isCorrect);
    const correctIds = correctAnomalies.map(a => a.id);

    if (group.role === 'blue') {
      const selectedIds = Array.isArray(submission.anomalies) ? submission.anomalies : [];
      let correctHits = 0;
      let penaltyHits = 0;

      selectedIds.forEach(id => {
        if (correctIds.includes(id)) {
          correctHits += 1;
        } else {
          penaltyHits += 1;
        }
      });

      const basePoints = correctHits * 20;
      const penaltyPoints = penaltyHits * 5;

      let speedBonus = 0;
      if (group.submissionOrder === 1) speedBonus = 15;
      else if (group.submissionOrder === 2) speedBonus = 10;
      else if (group.submissionOrder === 3) speedBonus = 5;

      const total = Math.max(0, basePoints - penaltyPoints + speedBonus);

      group.score = {
        ...group.score,
        anomaliesFound: selectedIds,
        correctCount: correctHits,
        penaltyCount: penaltyHits,
        basePoints,
        speedBonus,
        totalPoints: total
      };
    } else if (group.role === 'red') {
      let speedBonus = 0;
      if (group.submissionOrder === 1) speedBonus = 15;
      else if (group.submissionOrder === 2) speedBonus = 10;
      else if (group.submissionOrder === 3) speedBonus = 5;

      const defaultRedPts = 70;
      group.score = {
        ...group.score,
        redPoints: defaultRedPts,
        facilitatorStars: 4,
        speedBonus,
        totalPoints: defaultRedPts + speedBonus
      };
    }
  }

  rateRedTeam(code, groupId, { stars, notes, bonusPoints = 0 }) {
    const session = this.getSession(code);
    if (!session) return null;

    const group = session.groups.find(g => g.id === parseInt(groupId, 10));
    if (!group || group.role !== 'red') return null;

    const starCount = Math.min(Math.max(parseInt(stars, 10) || 1, 1), 5);
    const qualitativePts = starCount * 20 + (parseInt(bonusPoints, 10) || 0);

    group.score.facilitatorStars = starCount;
    group.score.redPoints = qualitativePts;
    group.score.facilitatorNotes = notes || '';
    group.score.totalPoints = qualitativePts + (group.score.speedBonus || 0);

    this.broadcastSessionUpdate(code);
    return group;
  }

  // --- PVP DUELO CRUZADO (INSTAGRAM, WHATSAPP & EMAIL) ---

  submitPvPAttack(code, redGroupId, attackPayload) {
    const session = this.getSession(code);
    if (!session || session.mode !== 'pvp') return { success: false, message: 'Sesión no es PvP.' };

    const redGroup = session.groups.find(g => g.id === parseInt(redGroupId, 10));
    if (!redGroup || redGroup.role !== 'red') return { success: false, message: 'Grupo no válido.' };

    const intentType = attackPayload.intentType || 'phishing';
    const isPhishing = intentType === 'phishing';
    const appType = attackPayload.appType || (attackPayload.username ? 'instagram' : (attackPayload.contactNumber ? 'whatsapp' : 'email'));

    // Format attack material preserving all app attributes
    const attackMaterial = {
      appType: appType,
      intentType: intentType,
      username: attackPayload.username || attackPayload.fromName || 'usuario_falso',
      bio: attackPayload.bio || '',
      followersCount: attackPayload.followersCount || '14 seguidores',
      contactName: attackPayload.contactName || attackPayload.fromName || 'Contacto Desconocido',
      contactNumber: attackPayload.contactNumber || attackPayload.fromEmail || '+54 9 11 9876-5432',
      fromName: attackPayload.fromName || attackPayload.username || attackPayload.contactName || 'Notificaciones Oficiales',
      fromEmail: attackPayload.fromEmail || attackPayload.contactNumber || 'alerta@colegio.edu.ar',
      to: 'alumnos@colegio.edu.ar',
      date: 'Hoy, ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      subject: attackPayload.subject || (appType === 'instagram' ? 'Mensaje Directo de Instagram' : 'Mensaje de WhatsApp'),
      bannerText: attackPayload.bannerText || (isPhishing ? 'AVISO DE SEGURIDAD' : 'COMUNICACIÓN INSTITUCIONAL'),
      message: attackPayload.message || '',
      bodyHtml: `<p>${attackPayload.message || ''}</p>`,
      linkUrl: attackPayload.linkUrl || '',
      hasVoiceNote: attackPayload.hasVoiceNote || false,
      attachment: attackPayload.attachmentName ? {
        name: attackPayload.attachmentName,
        size: '1.2 MB',
        warning: isPhishing ? 'Archivo adjunto recibido' : 'Documento adjunto oficial'
      } : null,
      trapsHidden: isPhishing && Array.isArray(attackPayload.trapsHidden) ? attackPayload.trapsHidden : []
    };

    session.submissionSequence += 1;
    redGroup.submissionOrder = session.submissionSequence;
    redGroup.submittedAt = new Date().toISOString();
    redGroup.status = 'submitted';
    redGroup.pvpPhase = 'waiting_defense';
    redGroup.submission = attackPayload;

    // Find paired match
    const match = session.pvpMatches.find(m => m.redGroupId === redGroup.id);
    if (match) {
      match.attackMaterial = attackMaterial;
      match.status = 'attack_sent';

      const pairedBlue = session.groups.find(g => g.id === match.blueGroupId);
      if (pairedBlue) {
        pairedBlue.receivedAttack = attackMaterial;
        pairedBlue.pvpPhase = 'detecting';

        if (this.io) {
          this.io.to(`${code}-group-${pairedBlue.id}`).emit('pvp:attackReceived', {
            attackMaterial,
            attackerName: redGroup.name
          });
        }
      }
    }

    this.broadcastSessionUpdate(code);
    return { success: true, redGroup, match };
  }

  submitPvPDefense(code, blueGroupId, defensePayload) {
    const session = this.getSession(code);
    if (!session || session.mode !== 'pvp') return { success: false, message: 'Sesión no es PvP.' };

    const blueGroup = session.groups.find(g => g.id === parseInt(blueGroupId, 10));
    if (!blueGroup || blueGroup.role !== 'blue') return { success: false, message: 'Grupo no válido.' };

    const match = session.pvpMatches.find(m => m.blueGroupId === blueGroup.id);
    if (!match || !match.attackMaterial) {
      return { success: false, message: 'No hay ataque recibido para defender.' };
    }

    const attackMaterial = match.attackMaterial;
    const isRealPhishing = attackMaterial.intentType === 'phishing';
    const trapsHidden = attackMaterial.trapsHidden || [];
    
    const verdict = defensePayload.verdict || 'phishing';
    const detectedTraps = Array.isArray(defensePayload.detectedTraps) ? defensePayload.detectedTraps : [];

    session.submissionSequence += 1;
    blueGroup.submissionOrder = session.submissionSequence;
    blueGroup.submittedAt = new Date().toISOString();
    blueGroup.status = 'submitted';
    blueGroup.pvpPhase = 'completed';
    blueGroup.submission = defensePayload;

    const redGroup = session.groups.find(g => g.id === match.redGroupId);

    let winner = 'tie';
    let summary = '';
    let blueTotal = 0;
    let redTotal = 0;
    let hits = [];
    let misses = [];
    let falsePositives = [];

    // =========================================================================
    // SCENARIO 1: Real Phishing & Blue detected Phishing (True Positive)
    // =========================================================================
    if (isRealPhishing && verdict === 'phishing') {
      hits = detectedTraps.filter(t => trapsHidden.includes(t));
      misses = trapsHidden.filter(t => !detectedTraps.includes(t));
      falsePositives = detectedTraps.filter(t => !trapsHidden.includes(t));

      winner = 'blue';
      blueTotal = 40 + (hits.length * 20) - (falsePositives.length * 5);
      redTotal = 15 + (misses.length * 15);
      summary = `🛡️ ¡DEFENSA EXITOSA! Era un engaño real y ${blueGroup.name} lo neutralizó descubriendo ${hits.length} trampas.`;
    }

    // =========================================================================
    // SCENARIO 2: Real Phishing & Blue marked Legitimate (False Negative)
    // =========================================================================
    else if (isRealPhishing && verdict === 'legitimate') {
      misses = [...trapsHidden];
      winner = 'red';
      redTotal = 60 + (trapsHidden.length * 15);
      blueTotal = 10;
      summary = `⚔️ ¡BRECHA DE SEGURIDAD! Era un engaño malicioso y ${blueGroup.name} confió en el atacante.`;
    }

    // =========================================================================
    // SCENARIO 3: Legitimate & Blue marked Phishing (False Positive)
    // =========================================================================
    else if (!isRealPhishing && verdict === 'phishing') {
      falsePositives = [...detectedTraps];
      winner = 'red';
      redTotal = 50;
      blueTotal = 15;
      summary = `⚠️ ¡FALSO POSITIVO! El mensaje era legítimo y ${blueGroup.name} lo bloqueó por desconfianza excesiva.`;
    }

    // =========================================================================
    // SCENARIO 4: Legitimate & Blue marked Legitimate (True Negative)
    // =========================================================================
    else if (!isRealPhishing && verdict === 'legitimate') {
      winner = 'blue';
      blueTotal = 60;
      redTotal = 20;
      summary = `🛡️ ¡VERIFICACIÓN IMPECABLE! ${blueGroup.name} validó correctamente el mensaje auténtico.`;
    }

    blueGroup.score = {
      ...blueGroup.score,
      pvpHits: hits.length,
      pvpMisses: misses.length,
      correctCount: hits.length,
      totalPoints: Math.max(0, blueTotal)
    };

    if (redGroup) {
      redGroup.pvpPhase = 'completed';
      redGroup.score = {
        ...redGroup.score,
        pvpHits: hits.length,
        pvpMisses: misses.length,
        totalPoints: Math.max(0, redTotal)
      };
    }

    match.status = 'completed';
    match.defenseResult = {
      detectedTraps,
      hits,
      misses,
      falsePositives,
      verdict,
      isRealPhishing,
      recommendations: defensePayload.recommendations || []
    };
    match.winner = winner;
    match.summary = summary;

    this.broadcastSessionUpdate(code);
    return { success: true, match, blueGroup, redGroup };
  }

  setPvPActiveMatch(code, matchIndex) {
    const session = this.getSession(code);
    if (!session || !session.pvpMatches) return null;

    session.activePvPMatchIndex = Math.min(Math.max(parseInt(matchIndex, 10) || 0, 0), session.pvpMatches.length - 1);
    this.broadcastSessionUpdate(code);
    return session;
  }

  // --- BUILDER MODE: Individual Component Assembly ---

  registerBuilderParticipant(code, alias, socketId) {
    const session = this.getSession(code);
    if (!session || session.mode !== 'builder') return null;

    // Check if alias already exists
    const existing = session.builderParticipants.find(p => p.alias === alias);
    if (existing) {
      // Reconnect
      if (!existing.sockets.includes(socketId)) {
        existing.sockets.push(socketId);
      }
      existing.status = existing.submitted ? 'submitted' : 'connected';
      this.broadcastSessionUpdate(code);
      return { session, participant: existing, reconnected: true };
    }

    if (session.builderParticipants.length >= session.builderMaxStudents) {
      return null;
    }

    const participant = {
      id: session.builderParticipants.length + 1,
      alias: alias,
      sockets: [socketId],
      status: 'connected',
      choices: {},
      submitted: false,
      submittedAt: null,
      score: {
        totalPoints: 0,
        maxPoints: 0,
        percentage: 0,
        categoryScores: []
      },
      feedback: null
    };

    session.builderParticipants.push(participant);
    this.broadcastSessionUpdate(code);
    return { session, participant, reconnected: false };
  }

  submitBuilderChoices(code, participantId, choices) {
    const session = this.getSession(code);
    if (!session || session.mode !== 'builder' || !session.builderScenario) {
      return { success: false, message: 'Sesión no válida para Builder.' };
    }

    const participant = session.builderParticipants.find(p => p.id === parseInt(participantId, 10));
    if (!participant) {
      return { success: false, message: 'Participante no encontrado.' };
    }
    if (participant.submitted) {
      return { success: false, message: 'Ya enviaste tu respuesta.' };
    }

    const scenario = session.builderScenario;
    const objective = session.builderObjective; // 'phishing' or 'legitimate'
    const categories = scenario.categories;

    let totalPoints = 0;
    let maxPoints = 0;
    const categoryScores = [];

    categories.forEach(category => {
      const chosenOptionId = choices[category.id];
      const chosenOption = category.options.find(o => o.id === chosenOptionId);

      // Calculate max possible score for this category
      const categoryMax = Math.max(...category.options.map(o => o.score[objective]));
      maxPoints += categoryMax;

      if (chosenOption) {
        const pts = chosenOption.score[objective];
        totalPoints += pts;

        const isOptimal = pts === categoryMax;
        const isGood = pts >= categoryMax * 0.7;

        categoryScores.push({
          categoryId: category.id,
          categoryLabel: category.label,
          categoryIcon: category.icon,
          chosenOptionId: chosenOption.id,
          chosenOptionLabel: chosenOption.label,
          points: pts,
          maxPoints: categoryMax,
          percentage: Math.round((pts / categoryMax) * 100),
          feedback: chosenOption.feedback[objective],
          rating: isOptimal ? 'optimal' : (isGood ? 'good' : 'weak')
        });
      } else {
        // No selection made for this category
        categoryScores.push({
          categoryId: category.id,
          categoryLabel: category.label,
          categoryIcon: category.icon,
          chosenOptionId: null,
          chosenOptionLabel: 'Sin selección',
          points: 0,
          maxPoints: categoryMax,
          percentage: 0,
          feedback: '❌ No elegiste ninguna opción en esta categoría.',
          rating: 'missing'
        });
      }
    });

    const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    // Generate overall feedback message
    let overallMessage = '';
    if (percentage >= 90) {
      overallMessage = '🏆 ¡Excelente trabajo! Demostraste un dominio avanzado de las técnicas de ingeniería social.';
    } else if (percentage >= 70) {
      overallMessage = '🎯 ¡Muy bien! Tenés una buena comprensión de las técnicas, con margen para mejorar.';
    } else if (percentage >= 50) {
      overallMessage = '⭐ Buen intento. Entendés los conceptos básicos pero podés profundizar más.';
    } else if (percentage >= 30) {
      overallMessage = '📚 Hay bastante por aprender. Revisá las explicaciones de cada categoría.';
    } else {
      overallMessage = '🔍 Las selecciones no se alinearon con el objetivo. ¡Leé los feedbacks para entender por qué!';
    }

    participant.choices = choices;
    participant.submitted = true;
    participant.submittedAt = new Date().toISOString();
    participant.status = 'submitted';
    participant.score = {
      totalPoints,
      maxPoints,
      percentage,
      categoryScores
    };
    participant.feedback = {
      overallMessage,
      objective,
      objectiveLabel: objective === 'phishing' ? '🎣 Ataque de Phishing' : '🟢 Señuelo Legítimo',
      categoryScores
    };

    this.broadcastSessionUpdate(code);
    return {
      success: true,
      participant,
      feedback: participant.feedback,
      ranking: this.getBuilderRanking(code)
    };
  }

  getBuilderRanking(code) {
    const session = this.getSession(code);
    if (!session || session.mode !== 'builder') return [];

    const submitted = session.builderParticipants.filter(p => p.submitted);
    const sorted = [...submitted].sort((a, b) => b.score.percentage - a.score.percentage);

    return sorted.map((p, idx) => ({
      position: idx + 1,
      alias: p.alias,
      percentage: p.score.percentage,
      totalPoints: p.score.totalPoints,
      maxPoints: p.score.maxPoints,
      submittedAt: p.submittedAt
    }));
  }

  handleBuilderDisconnect(socketId) {
    for (const [code, session] of this.sessions.entries()) {
      if (session.mode !== 'builder' || !session.builderParticipants) continue;
      session.builderParticipants.forEach(p => {
        const idx = p.sockets.indexOf(socketId);
        if (idx !== -1) {
          p.sockets.splice(idx, 1);
          if (p.sockets.length === 0 && !p.submitted) {
            p.status = 'disconnected';
          }
        }
      });
    }
  }

  // --- Projection Navigation ---
  setProjectionMode(code, mode, extraData = {}) {
    const session = this.getSession(code);
    if (!session) return null;

    session.projectionMode = mode;
    session.phase = mode;

    if (extraData.activeReviewGroupId) {
      session.activeReviewGroupId = parseInt(extraData.activeReviewGroupId, 10);
    }
    if (extraData.activePvPMatchIndex !== undefined) {
      session.activePvPMatchIndex = parseInt(extraData.activePvPMatchIndex, 10);
    }

    if (this.io) {
      this.io.to(code).emit('projection:modeChanged', {
        mode: session.projectionMode,
        activeReviewGroupId: session.activeReviewGroupId,
        activePvPMatchIndex: session.activePvPMatchIndex,
        extraData
      });
    }

    this.broadcastSessionUpdate(code);
    return session;
  }

  navigateReviewGroup(code, direction) {
    const session = this.getSession(code);
    if (!session) return null;

    if (session.mode === 'builder') {
      const participants = session.builderParticipants || [];
      const total = participants.length;
      if (total > 0) {
        let nextIdx = session.activeBuilderParticipantIndex || 0;
        if (direction === 'next') nextIdx = nextIdx >= total - 1 ? 0 : nextIdx + 1;
        else if (direction === 'prev') nextIdx = nextIdx <= 0 ? total - 1 : nextIdx - 1;
        session.activeBuilderParticipantIndex = nextIdx;
      }
    } else if (session.mode === 'pvp') {
      const total = session.pvpMatches.length;
      let nextId = session.activePvPMatchIndex || 0;
      if (direction === 'next') nextId = nextId >= total - 1 ? 0 : nextId + 1;
      else if (direction === 'prev') nextId = nextId <= 0 ? total - 1 : nextId - 1;
      session.activePvPMatchIndex = nextId;
    } else {
      const total = session.groups.length;
      let nextId = session.activeReviewGroupId || 1;
      if (direction === 'next') nextId = nextId >= total ? 1 : nextId + 1;
      else if (direction === 'prev') nextId = nextId <= 1 ? total : nextId - 1;
      session.activeReviewGroupId = nextId;
    }

    this.broadcastSessionUpdate(code);
    return session;
  }

  broadcastSessionUpdate(code) {
    const session = this.getSession(code);
    if (!session || !this.io) return;

    this.io.to(code).emit('session:update', this.getSanitizedSession(session));
    this.io.to(`${code}-facilitator`).emit('session:facilitatorUpdate', session);
  }

  getSanitizedSession(session) {
    return {
      code: session.code,
      mode: session.mode,
      caseId: session.caseId,
      caseData: session.caseData ? {
        id: session.caseData.id,
        title: session.caseData.title,
        subtitle: session.caseData.subtitle,
        type: session.caseData.type,
        material: session.caseData.material,
        redTeamPrompt: session.caseData.redTeamPrompt,
        blueTeamPrompt: session.caseData.blueTeamPrompt,
        anomalies: session.caseData.anomalies
      } : null,
      pvpTheme: session.pvpTheme,
      pvpTrapsCatalog: session.pvpTrapsCatalog,
      pvpMatches: session.pvpMatches,
      activePvPMatchIndex: session.activePvPMatchIndex || 0,
      activeBuilderParticipantIndex: session.activeBuilderParticipantIndex || 0,
      totalGroups: session.totalGroups,
      durationMinutes: session.durationMinutes,
      timer: session.timer,
      phase: session.phase,
      projectionMode: session.projectionMode,
      activeReviewGroupId: session.activeReviewGroupId,
      groups: session.groups.map(g => ({
        id: g.id,
        name: g.name,
        role: g.role,
        status: g.status,
        pvpPhase: g.pvpPhase,
        receivedAttack: g.receivedAttack,
        submittedAt: g.submittedAt,
        submissionOrder: g.submissionOrder,
        score: g.score,
        submission: g.submission
      })),
      // Builder mode data
      builderScenario: session.builderScenario || null,
      builderObjective: session.builderObjective || null,
      builderMaxStudents: session.builderMaxStudents || 0,
      builderParticipants: session.builderParticipants ? session.builderParticipants.map(p => ({
        id: p.id,
        alias: p.alias,
        status: p.status,
        submitted: p.submitted,
        submittedAt: p.submittedAt,
        score: p.score,
        feedback: p.feedback,
        choices: p.choices
      })) : null
    };
  }

  getExportData(code) {
    const session = this.getSession(code);
    if (!session) return null;

    if (session.mode === 'builder') {
      return {
        sessionCode: session.code,
        mode: 'builder',
        createdAt: session.createdAt,
        caseTitle: session.builderScenario?.title || 'Constructor Individual',
        caseType: session.builderScenario?.appType || 'builder',
        objective: session.builderObjective,
        totalParticipants: session.builderParticipants.length,
        submittedCount: session.builderParticipants.filter(p => p.submitted).length,
        durationMinutes: session.durationMinutes,
        ranking: this.getBuilderRanking(code),
        participants: session.builderParticipants
      };
    }

    const ranking = [...session.groups].sort((a, b) => (b.score.totalPoints || 0) - (a.score.totalPoints || 0));

    return {
      sessionCode: session.code,
      mode: session.mode,
      createdAt: session.createdAt,
      caseTitle: session.caseData ? session.caseData.title : `Duelo PvP: ${session.pvpTheme?.title}`,
      caseType: session.caseData ? session.caseData.type : 'pvp',
      totalGroups: session.totalGroups,
      durationMinutes: session.durationMinutes,
      pvpMatches: session.pvpMatches,
      ranking,
      groups: session.groups
    };
  }
}

module.exports = new SessionManager();
