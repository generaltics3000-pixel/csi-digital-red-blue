const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const sessionManager = require('./sessionManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

sessionManager.setIO(io);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- REST Endpoints ---

// Get all cases, PvP themes & Builder scenarios
app.get('/api/cases', (req, res) => {
  res.json({
    success: true,
    cases: sessionManager.getAllCases(),
    pvpThemes: sessionManager.getPvPThemes(),
    pvpTrapsCatalog: sessionManager.getPvPTrapsCatalog(),
    builderScenarios: sessionManager.getBuilderScenarios()
  });
});

// Create custom case
app.post('/api/cases', (req, res) => {
  try {
    const caseData = req.body;
    if (!caseData.title || !caseData.material) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios del caso (título o material).' });
    }
    const createdCase = sessionManager.addCustomCase(caseData);
    res.json({ success: true, case: createdCase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new game session (Guided, PvP or Builder)
app.post('/api/sessions', async (req, res) => {
  try {
    const {
      mode,
      caseId,
      pvpThemeId,
      builderScenarioId,
      builderObjective,
      studentCount,
      groupCount,
      durationMinutes,
      roleAssignment
    } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const session = await sessionManager.createSession({
      mode,
      caseId,
      pvpThemeId,
      builderScenarioId,
      builderObjective,
      studentCount,
      groupCount,
      durationMinutes,
      roleAssignment,
      baseUrl
    });

    res.json({ success: true, session });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get session details
app.get('/api/sessions/:code', (req, res) => {
  const session = sessionManager.getSession(req.params.code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Sesión no encontrada.' });
  }
  res.json({ success: true, session: sessionManager.getSanitizedSession(session) });
});

// Export session report
app.get('/api/sessions/:code/export', (req, res) => {
  const exportData = sessionManager.getExportData(req.params.code);
  if (!exportData) {
    return res.status(404).json({ success: false, message: 'Sesión no encontrada para exportar.' });
  }

  const format = req.query.format || 'json';
  if (format === 'json') {
    res.setHeader('Content-disposition', `attachment; filename=CSI_Session_${req.params.code}_Report.json`);
    res.setHeader('Content-type', 'application/json');
    return res.send(JSON.stringify(exportData, null, 2));
  }

  // Printable HTML Report
  const isPvP = exportData.mode === 'pvp';
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Taller CSI Digital - Sesión ${exportData.sessionCode}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #ffffff; line-height: 1.5; }
        h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
        h2 { color: #334155; margin-top: 28px; }
        .meta { background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 30px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
        th { background: #e2e8f0; font-weight: 600; }
        tr:nth-child(even) { background: #f8fafc; }
        .badge-red { color: #dc2626; font-weight: bold; }
        .badge-blue { color: #2563eb; font-weight: bold; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
        @media print { body { margin: 15mm; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">🖨️ Imprimir / Guardar en PDF</button>
      </div>
      <h1>CSI Digital · Reporte de Taller Red Team vs Blue Team ${isPvP ? '(Duelo Cruzado PvP)' : ''}</h1>
      <div class="meta">
        <div><strong>Código de Sesión:</strong> ${exportData.sessionCode}</div>
        <div><strong>Modalidad:</strong> ${isPvP ? '⚔️ Duelo Cruzado (PvP entre alumnos)' : '📁 Caso Guiado'}</div>
        <div><strong>Fecha:</strong> ${new Date(exportData.createdAt).toLocaleString('es-AR')}</div>
        <div><strong>Total de Grupos:</strong> ${exportData.totalGroups}</div>
      </div>

      <h2>🏆 Ranking Final de Puntajes</h2>
      <table>
        <thead>
          <tr>
            <th>Posición</th>
            <th>Grupo</th>
            <th>Rol</th>
            <th>Eficacia Táctica</th>
            <th>Puntaje Total</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.ranking.map((g, idx) => `
            <tr>
              <td><strong>#${idx + 1}</strong></td>
              <td>${g.name}</td>
              <td><span class="${g.role === 'red' ? 'badge-red' : 'badge-blue'}">${g.role.toUpperCase()} TEAM</span></td>
              <td>${isPvP ? `Aciertos: ${g.score.pvpHits || 0} / Trampas burladas: ${g.score.pvpMisses || 0}` : `${g.score.correctCount || 0}/5 aciertos`}</td>
              <td><strong>${g.score.totalPoints || 0} pts</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${isPvP && exportData.pvpMatches ? `
        <h2>⚔️ Resultados de Duelos Cara a Cara (PvP)</h2>
        ${exportData.pvpMatches.map(m => `
          <div class="card">
            <h3>Duelo #${m.matchId}: <span class="badge-red">${m.redGroupName}</span> ⚔️ <span class="badge-blue">${m.blueGroupName}</span></h3>
            <p><strong>Resultado:</strong> ${m.summary || 'En proceso'}</p>
            <p><strong>Ataque Creado por ${m.redGroupName}:</strong> "${m.attackMaterial?.subject || 'Sin asunto'}" (${m.attackMaterial?.trapsHidden?.length || 0} trampas sembradas)</p>
            <p><strong>Veredicto de ${m.blueGroupName}:</strong> ${m.defenseResult?.verdict === 'blocked' ? '🛡️ Ataque Bloqueado con Éxito' : '⚠️ Cayeron en el engaño'}</p>
          </div>
        `).join('')}
      ` : ''}
    </body>
    </html>
  `;
  res.send(html);
});

// --- Socket.IO Realtime Connection Handling ---

io.on('connection', (socket) => {
  // Facilitator connection
  socket.on('join:facilitator', ({ code }) => {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();
    const session = sessionManager.getSession(cleanCode);
    if (!session) {
      return socket.emit('error', { message: 'Sesión no encontrada.' });
    }

    socket.join(cleanCode);
    socket.join(`${cleanCode}-facilitator`);
    session.facilitatorConnected = true;

    socket.emit('session:facilitatorUpdate', session);
  });

  // Projection Screen connection
  socket.on('join:projection', ({ code }) => {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();
    const session = sessionManager.getSession(cleanCode);
    if (!session) {
      return socket.emit('error', { message: 'Sesión no encontrada.' });
    }

    socket.join(cleanCode);
    socket.emit('session:update', sessionManager.getSanitizedSession(session));
  });

  // Student Group connection
  socket.on('join:group', ({ code, groupId }) => {
    if (!code || !groupId) return;
    const cleanCode = code.toUpperCase().trim();
    const result = sessionManager.registerGroupConnection(cleanCode, groupId, socket.id);
    if (!result) {
      return socket.emit('error', { message: 'No se pudo conectar al grupo o la sesión no existe.' });
    }

    socket.join(cleanCode);
    socket.join(`${cleanCode}-group-${groupId}`);

    socket.emit('group:connected', {
      session: sessionManager.getSanitizedSession(result.session),
      group: result.group
    });
  });

  // Timer Controls from Facilitator
  socket.on('timer:start', ({ code }) => {
    sessionManager.startTimer(code);
  });

  socket.on('timer:pause', ({ code }) => {
    sessionManager.pauseTimer(code);
  });

  socket.on('timer:reset', ({ code }) => {
    sessionManager.resetTimer(code);
  });

  socket.on('timer:adjust', ({ code, deltaSeconds }) => {
    sessionManager.adjustTimer(code, deltaSeconds);
  });

  socket.on('timer:close', ({ code }) => {
    sessionManager.forceCloseSubmissions(code);
  });

  // Guided Mode Events
  socket.on('draft:save', ({ code, groupId, draft }) => {
    sessionManager.saveDraft(code, groupId, draft);
  });

  socket.on('response:submit', ({ code, groupId, submission }) => {
    const result = sessionManager.submitResponse(code, groupId, submission);
    if (!result.success) {
      socket.emit('submit:error', { message: result.message });
    } else {
      socket.emit('submit:success', { group: result.group });
    }
  });

  // PvP Mode Events
  socket.on('pvp:submitAttack', ({ code, groupId, attackPayload }) => {
    const result = sessionManager.submitPvPAttack(code, groupId, attackPayload);
    if (!result.success) {
      socket.emit('submit:error', { message: result.message });
    } else {
      socket.emit('pvp:attackSuccess', { group: result.redGroup });
    }
  });

  socket.on('pvp:submitDefense', ({ code, groupId, defensePayload }) => {
    const result = sessionManager.submitPvPDefense(code, groupId, defensePayload);
    if (!result.success) {
      socket.emit('submit:error', { message: result.message });
    } else {
      socket.emit('pvp:defenseSuccess', { group: result.blueGroup, match: result.match });
    }
  });

  socket.on('pvp:setActiveMatch', ({ code, matchIndex }) => {
    sessionManager.setPvPActiveMatch(code, matchIndex);
  });

  // Builder Mode Events
  socket.on('join:builder', ({ code, alias }) => {
    if (!code || !alias) {
      return socket.emit('error', { message: 'Se requiere código de sesión y un nombre/alias.' });
    }
    const cleanCode = code.toUpperCase().trim();
    const result = sessionManager.registerBuilderParticipant(cleanCode, alias.trim(), socket.id);
    if (!result) {
      return socket.emit('error', { message: 'No se pudo ingresar a la sesión de armador (capacidad llena o sesión no válida).' });
    }

    socket.join(cleanCode);
    socket.emit('builder:connected', {
      session: sessionManager.getSanitizedSession(result.session),
      participant: result.participant,
      reconnected: result.reconnected
    });
  });

  socket.on('builder:draftUpdate', ({ code, participantId, choices }) => {
    if (!code || !participantId) return;
    const cleanCode = code.toUpperCase().trim();
    const session = sessionManager.getSession(cleanCode);
    if (session && session.mode === 'builder' && session.builderParticipants) {
      const p = session.builderParticipants.find(x => x.id === parseInt(participantId, 10));
      if (p && !p.submitted) {
        p.choices = choices || {};
        p.status = 'typing';
        sessionManager.broadcastSessionUpdate(cleanCode);
      }
    }
  });

  socket.on('builder:submitChoices', ({ code, participantId, choices }) => {
    if (!code || !participantId) return;
    const cleanCode = code.toUpperCase().trim();
    const result = sessionManager.submitBuilderChoices(cleanCode, participantId, choices);
    if (!result.success) {
      socket.emit('submit:error', { message: result.message });
    } else {
      socket.emit('builder:choiceSubmitted', {
        participant: result.participant,
        feedback: result.feedback,
        ranking: result.ranking
      });
    }
  });

  socket.on('builder:setActiveParticipant', ({ code, participantIndex }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const session = sessionManager.getSession(cleanCode);
    if (session && session.mode === 'builder') {
      session.activeBuilderParticipantIndex = participantIndex;
      sessionManager.broadcastSessionUpdate(cleanCode);
    }
  });

  // Rate Red Team
  socket.on('rate:redTeam', ({ code, groupId, stars, notes, bonusPoints }) => {
    sessionManager.rateRedTeam(code, groupId, { stars, notes, bonusPoints });
  });

  // Projection Mode Change
  socket.on('projection:setMode', ({ code, mode, extraData }) => {
    sessionManager.setProjectionMode(code, mode, extraData);
  });

  // Projection Review / Match Navigation
  socket.on('projection:navigateReview', ({ code, direction }) => {
    sessionManager.navigateReviewGroup(code, direction);
  });

  // Disconnect
  socket.on('disconnect', () => {
    sessionManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` 🛡️  CSI Digital - Red Team vs Blue Team Server Started`);
  console.log(` 🌐 Local: http://localhost:${PORT}`);
  console.log(` 👩‍🏫 Facilitador: http://localhost:${PORT}/facilitador.html`);
  console.log(` 📽️  Proyección: http://localhost:${PORT}/proyeccion.html`);
  console.log(` 📱 Alumnos: http://localhost:${PORT}/`);
  console.log(`=======================================================`);
});
