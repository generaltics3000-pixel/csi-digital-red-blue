const http = require('http');

async function runAppsTests() {
  console.log('--- INICIANDO VERIFICACIÓN: SIMULADORES DE INSTAGRAM & WHATSAPP ---');

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

  const PORT = 3115;
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`✓ Servidor de prueba Apps corriendo en puerto ${PORT}`);

  // Test 1: Crear sesión PvP con temática de Instagram DM
  const createRes = await fetch(`http://localhost:${PORT}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'pvp',
      pvpThemeId: 'theme-instagram-dm',
      groupCount: 4,
      durationMinutes: 15,
      roleAssignment: 'auto'
    })
  });
  const createData = await createRes.json();
  const session = createData.session;
  const code = session.code;
  console.log(`✓ Test 1: Sesión PvP ${code} creada con temática ${session.pvpTheme.title}`);

  // Conectar 4 grupos
  sessionManager.registerGroupConnection(code, 1, 's-g1');
  sessionManager.registerGroupConnection(code, 2, 's-g2');
  sessionManager.registerGroupConnection(code, 3, 's-g3');
  sessionManager.registerGroupConnection(code, 4, 's-g4');

  // =========================================================================
  // DUELO 1: INSTAGRAM DM (Red 1 ⚔️ Blue 2)
  // =========================================================================
  const igAttack = {
    appType: 'instagram',
    intentType: 'phishing',
    username: 'duki_oficiall_entradas',
    bio: 'Cuenta de sorteos oficiales. 2 publicaciones · 14 seguidores',
    message: '¡Felicitaciones! Ganaste 2 entradas VIP para el show. Confirmá tu cuenta en el link antes de las 20hs:',
    linkUrl: 'https://entradas-recitales.free.nf/reclamar',
    trapsHidden: ['trap_cloned_profile', 'trap_dm_social_engineering', 'trap_fake_link', 'trap_urgency_threat']
  };

  const igAttackRes = sessionManager.submitPvPAttack(code, 1, igAttack);
  const blue2 = sessionManager.getSession(code).groups.find(g => g.id === 2);
  if (!blue2.receivedAttack || blue2.receivedAttack.username !== 'duki_oficiall_entradas') {
    throw new Error('Blue Team 2 no recibió el DM de Instagram.');
  }
  console.log(`✓ Duelo #1: Red 1 envió DM de Instagram desde @${blue2.receivedAttack.username} al Blue Team 2`);

  // Blue 2 defiende
  const igDefense = {
    verdict: 'phishing',
    detectedTraps: ['trap_cloned_profile', 'trap_dm_social_engineering', 'trap_fake_link', 'trap_urgency_threat'],
    recommendations: ['No confiar en cuentas con letras dobles y pocos seguidores']
  };
  const igDefRes = sessionManager.submitPvPDefense(code, 2, igDefense);
  console.log(`✓ Duelo #1 Resuelto: ${igDefRes.match.summary}`);
  console.log(`  - Blue Team Score: ${igDefRes.blueGroup.score.totalPoints} pts (Ganador: ${igDefRes.match.winner})`);

  // =========================================================================
  // DUELO 2: WHATSAPP CHAT (Red 3 ⚔️ Blue 4)
  // =========================================================================
  const waAttack = {
    appType: 'whatsapp',
    intentType: 'phishing',
    contactName: 'Soporte WhatsApp Oficial',
    contactNumber: '+54 9 11 9876-5432',
    message: 'Su cuenta será suspendida en 15 minutos si no valida el código de verificación SMS.',
    linkUrl: 'https://seguridad-whatsapp.free.nf/login',
    hasVoiceNote: true,
    trapsHidden: ['trap_suspicious_phone', 'trap_urgency_threat', 'trap_fake_link']
  };

  const waAttackRes = sessionManager.submitPvPAttack(code, 3, waAttack);
  const blue4 = sessionManager.getSession(code).groups.find(g => g.id === 4);
  if (!blue4.receivedAttack || !blue4.receivedAttack.hasVoiceNote) {
    throw new Error('Blue Team 4 no recibió el chat con nota de voz de WhatsApp.');
  }
  console.log(`✓ Duelo #2: Red 3 envió chat de WhatsApp con nota de voz simulada al Blue Team 4`);

  const waDefense = {
    verdict: 'phishing',
    detectedTraps: ['trap_suspicious_phone', 'trap_urgency_threat', 'trap_fake_link'],
    recommendations: ['WhatsApp nunca te contacta desde un número común pidiendo códigos']
  };
  const waDefRes = sessionManager.submitPvPDefense(code, 4, waDefense);
  console.log(`✓ Duelo #2 Resuelto: ${waDefRes.match.summary}`);
  console.log(`  - Blue Team Score: ${waDefRes.blueGroup.score.totalPoints} pts (Ganador: ${waDefRes.match.winner})`);

  server.close();
  console.log('--- TODOS LOS TESTS DE INSTAGRAM Y WHATSAPP PASARON EXITOSAMENTE ---');
  process.exit(0);
}

runAppsTests().catch(err => {
  console.error('ERROR EN TESTS APPS:', err);
  process.exit(1);
});
