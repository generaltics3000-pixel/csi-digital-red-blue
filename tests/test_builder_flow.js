const http = require('http');

async function runBuilderTests() {
  console.log('--- INICIANDO VERIFICACIÓN: MODO LABORATORIO / ARMADOR (BUILDER) ---');

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
      pvpTrapsCatalog: sessionManager.getPvPTrapsCatalog(),
      builderScenarios: sessionManager.getBuilderScenarios()
    });
  });
  app.post('/api/sessions', async (req, res) => {
    const s = await sessionManager.createSession(req.body);
    res.json({ success: true, session: s });
  });

  const PORT = 3120;
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`✓ Servidor de prueba Builder corriendo en puerto ${PORT}`);

  // Test 1: Verificar API /api/cases
  const casesRes = await fetch(`http://localhost:${PORT}/api/cases`);
  const casesData = await casesRes.json();
  if (!casesData.builderScenarios || casesData.builderScenarios.length < 3) {
    throw new Error('Faltan escenarios de builder en /api/cases');
  }
  console.log(`✓ Test 1: ${casesData.builderScenarios.length} escenarios de armador disponibles (WhatsApp, Instagram, Correo)`);

  // Test 2: Crear sesión en Modo Builder con WhatsApp y objetivo Phishing
  const createRes = await fetch(`http://localhost:${PORT}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'builder',
      builderScenarioId: 'builder-whatsapp',
      builderObjective: 'phishing',
      studentCount: 30,
      durationMinutes: 15
    })
  });
  const createData = await createRes.json();
  const session = createData.session;
  const code = session.code;
  console.log(`✓ Test 2: Sesión Builder creada con código ${code} para ${session.builderScenario.title} (Objetivo: ${session.builderObjective})`);

  // Test 3: Registrar participantes individuales
  const p1 = sessionManager.registerBuilderParticipant(code, 'Mateo_CNBA', 'socket-1');
  const p2 = sessionManager.registerBuilderParticipant(code, 'Sofia_3B', 'socket-2');
  if (!p1 || !p2 || sessionManager.getSession(code).builderParticipants.length !== 2) {
    throw new Error('Error al registrar participantes en Builder');
  }
  console.log(`✓ Test 3: 2 alumnos registrados exitosamente (Mateo_CNBA y Sofia_3B)`);

  // Test 4: Mateo envía selección óptima de Phishing
  const mateoChoices = {
    sender: 'sender_institution', // Beca Conectividad Estudiantil (20 pts)
    body: 'body_threat',          // Amenaza de suspensión en 30 min (25 pts)
    link: 'link_typo',            // mercad0pago-soporte.xyz (25 pts)
    tone: 'tone_extreme',         // Urgente 30 minutos (22 pts)
    technique: 'tech_attachment'  // Comprobante.pdf.exe (20 pts)
  };
  const mateoResult = sessionManager.submitBuilderChoices(code, 1, mateoChoices);
  if (!mateoResult.success || mateoResult.participant.score.percentage < 80) {
    throw new Error(`Puntuación inesperada para Mateo: ${mateoResult.participant?.score?.percentage}%`);
  }
  console.log(`✓ Test 4: Mateo entregó su mensaje con éxito: ${mateoResult.participant.score.percentage}% (${mateoResult.participant.score.totalPoints} pts)`);
  console.log(`  - Feedback general: "${mateoResult.feedback.overallMessage}"`);

  // Test 5: Sofia envía selección no alineada (mensajes legítimos en ejercicio de phishing)
  const sofiaChoices = {
    sender: 'sender_friend',
    body: 'body_casual',
    link: 'link_none',
    tone: 'tone_neutral',
    technique: 'tech_none'
  };
  const sofiaResult = sessionManager.submitBuilderChoices(code, 2, sofiaChoices);
  if (!sofiaResult.success) {
    throw new Error('Error al registrar entrega de Sofia');
  }
  console.log(`✓ Test 5: Sofia entregó su mensaje: ${sofiaResult.participant.score.percentage}% (${sofiaResult.participant.score.totalPoints} pts)`);

  // Test 6: Navegación de revisión
  sessionManager.setProjectionMode(code, 'review');
  sessionManager.navigateReviewGroup(code, 'next');
  const sAfter = sessionManager.getSession(code);
  console.log(`✓ Test 6: Navegación de galería en proyector (Índice activo: ${sAfter.activeBuilderParticipantIndex})`);

  // Test 7: Exportación de datos
  const exportData = sessionManager.getExportData(code);
  if (!exportData || exportData.ranking.length !== 2) {
    throw new Error('Ranking de exportación incompleto');
  }
  console.log(`✓ Test 7: Ranking generado. 1er puesto: ${exportData.ranking[0].alias} (${exportData.ranking[0].percentage}%)`);

  server.close();
  console.log('--- TODOS LOS TESTS DEL MODO BUILDER PASARON EXITOSAMENTE ---');
  process.exit(0);
}

runBuilderTests().catch(err => {
  console.error('ERROR EN TESTS BUILDER:', err);
  process.exit(1);
});
