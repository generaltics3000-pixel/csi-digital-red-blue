/**
 * Case Material Renderer Component (Email, WhatsApp & Instagram DM)
 * Renderiza de manera ultra-realista correos electrónicos, chats de WhatsApp y DMs de Instagram
 */

const CaseViewer = {
  render(material, type = 'email', options = {}) {
    const isRevealMode = options.revealMode || false;
    const revealedAnomalies = options.anomalies || [];

    if (type === 'instagram') {
      return this.renderInstagramDM(material, isRevealMode, revealedAnomalies);
    } else if (type === 'whatsapp') {
      return this.renderWhatsApp(material, isRevealMode, revealedAnomalies);
    } else {
      return this.renderEmail(material, isRevealMode, revealedAnomalies);
    }
  },

  // =========================================================================
  // 1. INSTAGRAM DM RENDERER
  // =========================================================================
  renderInstagramDM(material, isRevealMode, anomalies) {
    const username = material.username || material.fromName || 'cuenta_usuario';
    const isVerified = material.verified || false;
    const followers = material.followersCount || '14 seguidores';
    const bio = material.bio || 'Cuenta oficial de promociones y novedades juveniles.';
    const messages = Array.isArray(material.messages) ? material.messages : [
      { sender: 'other', text: material.message || material.bodyHtml || '¡Hola! Te enviamos este mensaje.', time: '18:40' }
    ];

    return `
      <div class="instagram-mockup-wrapper ${isRevealMode ? 'reveal-mode' : ''}">
        <!-- Instagram Header -->
        <div class="ig-dm-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem; cursor: pointer;">‹</span>
            <div class="ig-avatar-ring">
              <div class="ig-avatar-inner">${(username[0] || 'I').toUpperCase()}</div>
            </div>
            <div>
              <div class="ig-username-title">
                @${username}
                ${isVerified ? '<span class="ig-verified-icon">✓</span>' : ''}
              </div>
              <div class="ig-activity-status">Activo(a) hoy</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 14px;">
            <button type="button" class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="CaseViewer.openIGProfile('${username}', '${followers}', '${encodeURIComponent(bio)}', '${material.linkUrl || ''}')">
              👤 Ver Perfil
            </button>
            <span style="font-size: 1.2rem; color: #a8a8a8;">📞</span>
            <span style="font-size: 1.2rem; color: #a8a8a8;">📹</span>
          </div>
        </div>

        <!-- Message Request Banner (If unverified / unknown) -->
        <div class="ig-request-banner">
          <div>
            <strong style="color: #ffffff;">Solicitud de mensaje</strong>
            <div style="font-size: 0.75rem; color: #a8a8a8;">@${username} quiere enviarte un mensaje (${followers}).</div>
          </div>
        </div>

        <!-- Chat Timeline -->
        <div class="ig-dm-body">
          <div style="text-align: center; font-size: 0.72rem; color: #737373; margin: 10px 0;">HOY 18:32</div>

          ${messages.map((m, idx) => `
            <div class="ig-bubble-row ${m.sender === 'me' ? 'bubble-row-me' : 'bubble-row-other'}">
              <div class="ig-bubble ${m.sender === 'me' ? 'ig-bubble-me' : 'ig-bubble-other'}">
                <div>${m.text}</div>
                ${material.linkUrl ? `
                  <div class="ig-link-preview-box">
                    <div style="font-size: 0.72rem; color: #3897f0; text-transform: uppercase;">Enlace Compartido</div>
                    <div style="font-weight: bold; font-size: 0.82rem; color: #ffffff; word-break: break-all;">${material.linkUrl}</div>
                  </div>
                ` : ''}
                <div class="ig-bubble-time">${m.time || '18:35'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  openIGProfile(username, followers, encodedBio, link) {
    const bio = decodeURIComponent(encodedBio);
    alert(
      `📸 PERFIL DE INSTAGRAM (@${username})\n` +
      `-----------------------------------------\n` +
      `👥 Seguidores: ${followers}\n` +
      `📝 Biografía: ${bio}\n` +
      `🔗 Enlace en Bio: ${link || 'Sin enlace'}\n` +
      `📅 Antigüedad: Cuenta creada hace 3 días`
    );
  },

  // =========================================================================
  // 2. WHATSAPP RENDERER
  // =========================================================================
  renderWhatsApp(material, isRevealMode, anomalies) {
    const contactName = material.contactName || material.fromName || 'Número Desconocido';
    const contactNumber = material.contactNumber || material.fromEmail || '+54 9 11 9876-5432';
    const messages = Array.isArray(material.messages) ? material.messages : [
      { sender: 'other', text: material.message || material.bodyHtml || 'Mensaje de WhatsApp', time: '14:22' }
    ];

    return `
      <div class="whatsapp-mockup-wrapper ${isRevealMode ? 'reveal-mode' : ''}">
        <!-- WhatsApp Header -->
        <div class="chat-contact-header">
          <div class="chat-avatar">${(contactName[0] || 'W').toUpperCase()}</div>
          <div class="chat-contact-info">
            <div class="contact-name">
              ${contactName}
              ${material.verified ? '<span class="verified-badge">✓</span>' : '<span class="unverified-badge">No agendado</span>'}
            </div>
            <div class="contact-number">${contactNumber} · <span class="online-status">En línea</span></div>
          </div>
          <div>
            <button type="button" class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="alert('ℹ️ INFORMACIÓN DE CONTACTO\\n-------------------------\\nNombre: ${contactName}\\nNúmero: ${contactNumber}\\nEstado: No está en tu lista de contactos agendados')">
              ℹ️ Info
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="chat-body-container">
          <div class="chat-encryption-notice">
            🔒 Este contacto no pertenece a tu lista de contactos verificados. Ten precaución al abrir enlaces o compartir códigos.
          </div>

          <!-- Voice Note Simulation (If present) -->
          ${material.hasVoiceNote ? `
            <div class="chat-bubble-row">
              <div class="chat-bubble bubble-other whatsapp-voice-bubble">
                <div class="voice-player-row">
                  <button type="button" class="voice-play-btn" onclick="CaseViewer.toggleVoiceNote(this)">▶</button>
                  <div class="voice-waveform-box">
                    <span class="waveform-bar bar-1"></span>
                    <span class="waveform-bar bar-2"></span>
                    <span class="waveform-bar bar-3"></span>
                    <span class="waveform-bar bar-4"></span>
                    <span class="waveform-bar bar-5"></span>
                    <span class="waveform-bar bar-6"></span>
                    <span class="waveform-bar bar-7"></span>
                  </div>
                  <span class="voice-duration">0:14</span>
                  <div class="voice-mic-icon">🎙️</div>
                </div>
                <div class="bubble-time">14:22 ✓✓</div>
              </div>
            </div>
          ` : ''}

          <!-- Text Messages -->
          ${messages.map(msg => `
            <div class="chat-bubble-row">
              <div class="chat-bubble ${msg.sender === 'me' ? 'bubble-me' : 'bubble-other'}">
                <div class="bubble-text">${msg.text}</div>
                ${material.linkUrl ? `
                  <div style="margin-top: 8px; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border-left: 3px solid #00a884;">
                    <div style="font-size: 0.72rem; color: #8696a0;">ENLACE EXTERNO</div>
                    <a href="#" class="fake-url-highlight" onclick="event.preventDefault();">${material.linkUrl}</a>
                  </div>
                ` : ''}
                <div class="bubble-time">${msg.time || '14:24'} ✓✓</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  toggleVoiceNote(btn) {
    if (btn.innerText === '▶') {
      btn.innerText = '⏸';
      window.soundEngine.playBeep(440, 0.2);
      setTimeout(() => { btn.innerText = '▶'; }, 3000);
    } else {
      btn.innerText = '▶';
    }
  },

  // =========================================================================
  // 3. EMAIL RENDERER
  // =========================================================================
  renderEmail(material, isRevealMode, anomalies) {
    return `
      <div class="email-mockup-wrapper ${isRevealMode ? 'reveal-mode' : ''}">
        <div class="email-window-bar">
          <div class="window-dots">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <div class="window-title">📩 Webmail Institucional v4.2 — Visualizador de Mensaje</div>
          <div class="window-actions">🔒 Conexión Segura</div>
        </div>

        <div class="email-content-box">
          <div class="email-headers-section">
            <div class="email-subject-line">
              <span class="email-subject-badge">ASUNTO:</span>
              <span class="email-subject-text">${material.subject || 'Sin asunto'}</span>
            </div>

            <div class="email-meta-grid">
              <div class="email-from-header">
                <span class="meta-label">De:</span>
                <strong class="from-name">${material.fromName || 'Remitente'}</strong>
                <span class="from-address">&lt;${material.fromEmail || ''}&gt;</span>
              </div>

              <div class="email-to-header">
                <span class="meta-label">Para:</span>
                <span class="to-address">${material.to || 'alumnos@colegio.edu.ar'}</span>
              </div>

              <div class="email-date-header">
                <span class="meta-label">Fecha:</span>
                <span class="date-text">${material.date || 'Hoy'}</span>
              </div>
            </div>
          </div>

          ${material.bannerText ? `
            <div class="email-urgency-box">
              <div class="banner-icon">⚠️</div>
              <div class="banner-text">${material.bannerText}</div>
            </div>
          ` : ''}

          <div class="email-body-section">
            ${material.bodyHtml || `<p>${material.message || ''}</p>`}
          </div>

          ${material.attachment ? `
            <div class="email-attachment-box">
              <div class="attachment-icon">📁</div>
              <div class="attachment-details">
                <div class="attachment-name"><strong>${material.attachment.name}</strong> (${material.attachment.size || '1.2 MB'})</div>
                <div class="attachment-sub">${material.attachment.warning || 'Archivo adjunto recibido'}</div>
              </div>
              <div class="attachment-action">
                <button type="button" class="btn btn-outline btn-sm" onclick="alert('⚠️ Aviso CSI: No descargues archivos ejecutables sin verificar al remitente.')">Examinar</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};

window.CaseViewer = CaseViewer;
