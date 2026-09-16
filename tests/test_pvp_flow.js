const http = require('http');

async function runPvPTests() {
  console.log('--- INICIANDO TEST: MODO DUELO CRUZADO (PHISHING vs LEGÍTIMO) ---');

  const express = require('express');
  const { Server } = require('socket.io');
  const sessionManager = require('../server/sessionManager');
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  sessionManager.setIO(io);

  app.use(express.json());
  app.get('/api/cases', (req, res) => {
    res.json({
      success: true,
      cases: sessionManager.getAllCases(),
      pvpThemes: sessionManager.getPvPThemes(),
      pvpTrapsCatalog: sessionManager.getPvPTrapsCatalog()
    });
  });
  app.post('/api/sessions', async (req, res) => {
    const s = await sessionManager.createSession(req.body);
    res.json({ success: true, session: s });
  });

  const PORT = 3110;
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`✓ Servidor de prueba PvP corriendo en puerto ${PORT}`);

  // Test 1: Crear sesión PvP con 4 grupos (2 Duelos: G1 vs G2, G3 vs G4)
  const createRes = await fetch(`http://localhost:${PORT}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'pvp',
      pvpThemeId: 'theme-escuela',
      groupCount: 4,
      durationMinutes: 15,
      roleAssignment: 'auto'
    })
  });
  const createData = await createRes.json();
  const session = createData.session;
  const code = session.code;
  console.log(`✓ Test 1: Sesión PvP ${code} creada con ${session.pvpMatches.length} duelos`);

  // Conectar 4 grupos
  sessionManager.registerGroupConnection(code, 1, 's-g1');
  sessionManager.registerGroupConnection(code, 2, 's-g2');
  sessionManager.registerGroupConnection(code, 3, 's-g3');
  sessionManager.registerGroupConnection(code, 4, 's-g4');

  // =========================================================================
  // DUELO 1: Red 1 envía PHISHING -> Blue 2 detecta PHISHING (Verdadero Positivo)
  // =========================================================================
  const attack1 = {
    intentType: 'phishing',
    fromName: 'Dirección Escolar',
    fromEmail: 'comunicados@coleg1o.edu.ar',
    subject: '⚠️ [URGENTE] Suspensión de clases',
    message: 'Hagan clic para validar matrícula.',
    linkUrl: 'https://portal.free.nf/login',
    trapsHidden: ['trap_domain_spoof', 'trap_urgency_threat', 'trap_fake_link']
  };
  sessionManager.submitPvPAttack(code, 1, attack1);

  const defense1 = {
    verdict: 'phishing',
    detectedTraps: ['trap_domain_spoof', 'trap_urgency_threat', 'trap_fake_link'],
    recommendations: ['Verificar dominio institucional']
  };
  const res1 = sessionManager.submitPvPDefense(code, 2, defense1);
  console.log(`✓ Duelo #1 (Phishing vs Detección): ${res1.match.summary}`);
  console.log(`  - Blue Team Score: ${res1.blueGroup.score.totalPoints} pts (Ganador: ${res1.match.winner})`);

  // =========================================================================
  // DUELO 2: Red 3 envía SEÑUELO LEGÍTIMO -> Blue 4 bloquea por error (Falso Positivo)
  // =========================================================================
  const attack2 = {
    intentType: 'legitimate',
    fromName: 'Secretaría de Alumnos',
    fromEmail: 'secretaria@colegio.edu.ar',
    subject: 'Circular N° 12: Calendario de Exámenes de Fin de Año',
    message: 'Estimada comunidad, adjuntamos las fechas oficiales del calendario.',
    linkUrl: 'https://colegio.edu.ar/examenes-2026',
    trapsHidden: []
  };
  sessionManager.submitPvPAttack(code, 3, attack2);

  const defense2 = {
    verdict: 'phishing', // ¡Blue comete un falso positivo!
    detectedTraps: ['trap_fake_link'],
    recommendations: ['Desconfiamos de los links']
  };
  const res2 = sessionManager.submitPvPDefense(code, 4, defense2);
  console.log(`✓ Duelo #2 (Señuelo Legítimo vs Paranoia): ${res2.match.summary}`);
  console.log(`  - Red Team Score: ${res2.redGroup.score.totalPoints} pts (Ganador: ${res2.match.winner})`);

  server.close();
  console.log('--- TODOS LOS TESTS DE MATRIZ PHISHING/LEGÍTIMO PASARON EXITOSAMENTE ---');
}

runPvPTests().catch(err => {
  console.error('ERROR EN TESTS:', err);
  process.exit(1);
});
