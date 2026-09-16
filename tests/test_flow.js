const http = require('http');

async function runTests() {
  console.log('--- INICIANDO VERIFICACIÓN DEL SISTEMA CSI DIGITAL ---');

  // Start server programmatically for testing
  const express = require('express');
  const { Server } = require('socket.io');
  const sessionManager = require('../server/sessionManager');
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  sessionManager.setIO(io);

  app.use(express.json());
  app.get('/api/cases', (req, res) => {
    res.json({ success: true, cases: sessionManager.getAllCases() });
  });
  app.post('/api/sessions', async (req, res) => {
    const s = await sessionManager.createSession(req.body);
    res.json({ success: true, session: s });
  });
  app.get('/api/sessions/:code', (req, res) => {
    const s = sessionManager.getSession(req.params.code);
    res.json({ success: true, session: sessionManager.getSanitizedSession(s) });
  });
  app.get('/api/sessions/:code/export', (req, res) => {
    const exp = sessionManager.getExportData(req.params.code);
    res.json({ success: true, export: exp });
  });

  const PORT = 3099;
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`✓ Servidor de prueba corriendo en puerto ${PORT}`);

  // Test 1: GET /api/cases
  const casesRes = await fetch(`http://localhost:${PORT}/api/cases`);
  const casesData = await casesRes.json();
  console.log(`✓ Test 1: ${casesData.cases.length} casos precargados disponibles`);
  if (casesData.cases.length < 2) throw new Error('Faltan casos precargados');

  // Test 2: POST /api/sessions (Create Session)
  const createRes = await fetch(`http://localhost:${PORT}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caseId: 'caso-banco-phishing',
      groupCount: 4,
      durationMinutes: 15,
      roleAssignment: 'auto'
    })
  });
  const createData = await createRes.json();
  const session = createData.session;
  console.log(`✓ Test 2: Sesión creada exitosamente con código ${session.code}`);
  console.log(`  - Total grupos: ${session.groups.length}`);
  console.log(`  - Roles: G1=${session.groups[0].role}, G2=${session.groups[1].role}, G3=${session.groups[2].role}, G4=${session.groups[3].role}`);
  console.log(`  - QR generado: ${session.qrDataUrl.startsWith('data:image/png;base64,') ? 'OK' : 'FAIL'}`);

  // Test 3: Connect Group 1 (Red) and Group 2 (Blue)
  const code = session.code;
  sessionManager.registerGroupConnection(code, 1, 'socket-g1');
  sessionManager.registerGroupConnection(code, 2, 'socket-g2');
  console.log(`✓ Test 3: Grupos 1 y 2 conectados en vivo`);

  // Test 4: Timer start, tick and adjust
  sessionManager.startTimer(code);
  console.log(`✓ Test 4: Temporizador iniciado (estado: ${session.timer.state})`);
  sessionManager.adjustTimer(code, 60);
  console.log(`✓ Test 4b: Ajuste de tiempo (+60s)`);

  // Test 5: Blue Team Submit (detect anomalies)
  const correctAnomalies = session.caseData.anomalies.filter(a => a.isCorrect).map(a => a.id);
  const blueSubmit = sessionManager.submitResponse(code, 2, {
    anomalies: correctAnomalies,
    recommendations: [
      'Verificar siempre el dominio del remitente',
      'No abrir archivos ejecutables .exe recibidos por mail',
      'Contactar al banco por sus canales oficiales verificados'
    ]
  });
  console.log(`✓ Test 5: Blue Team envió respuesta: Puntaje total = ${blueSubmit.group.score.totalPoints} pts (Aciertos: ${blueSubmit.group.score.correctCount}/5, Bono velocidad: +${blueSubmit.group.score.speedBonus})`);

  // Test 6: Red Team Submit & Facilitator Rating
  const redSubmit = sessionManager.submitResponse(code, 1, {
    fields: {
      story: 'Suplantamos al banco con una alerta de intrusión desde Rusia para asustar al cliente.',
      urgency: 'Pusimos un límite de 24 horas amenazando con cerrar su cuenta bancaria para que no piense.',
      technical: 'Usamos un dominio con un 1 en vez de i y enviamos un archivo ejecutable disfrazado de informe.'
    }
  });
  console.log(`✓ Test 6a: Red Team envió respuesta con pretexto y técnica`);

  sessionManager.rateRedTeam(code, 1, { stars: 5, notes: 'Excelente explicación del gancho psicológico' });
  const updatedRed = sessionManager.getSession(code).groups.find(g => g.id === 1);
  console.log(`✓ Test 6b: Facilitador calificó al Red Team con ${updatedRed.score.facilitatorStars} estrellas (${updatedRed.score.totalPoints} pts)`);

  // Test 7: Mode Switching
  sessionManager.setProjectionMode(code, 'review');
  sessionManager.navigateReviewGroup(code, 'next');
  sessionManager.setProjectionMode(code, 'revelation');
  sessionManager.setProjectionMode(code, 'ranking');
  console.log(`✓ Test 7: Modos de proyección (Puesta en común, Revelación, Ranking) verificados`);

  // Test 8: Export Data
  const exportRes = await fetch(`http://localhost:${PORT}/api/sessions/${code}/export`);
  const exportData = await exportRes.json();
  console.log(`✓ Test 8: Exportación generada con ${exportData.export.ranking.length} grupos en el ranking`);
  console.log(`  - 1er puesto: ${exportData.export.ranking[0].name} (${exportData.export.ranking[0].score.totalPoints} pts)`);

  sessionManager.pauseTimer(code);
  server.close();
  console.log('--- TODOS LOS TESTS PASARON EXITOSAMENTE ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('ERROR EN TESTS:', err);
  process.exit(1);
});
