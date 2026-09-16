/**
 * Casos precargados, Catálogo de Trampas y Temáticas de Apps (WhatsApp, Instagram, Correo) para CSI Digital
 */

const pvpTrapsCatalog = [
  {
    id: "trap_cloned_profile",
    code: "IG1",
    title: "Perfil clonado / Usuario impostor en Instagram",
    description: "El usuario tiene letras repetidas o puntos extras (ej: @duki_oficiall_, @colegio_sorteos_) y casi no tiene seguidores.",
    category: "social_media",
    app: "instagram"
  },
  {
    id: "trap_dm_social_engineering",
    code: "IG2",
    title: "Ingeniería social por DM ('Salís en este video' / Sorteo falso)",
    description: "Usa el morbo, la vergüenza o un premio falso para que toques el enlace sin dudar.",
    category: "social_media",
    app: "instagram"
  },
  {
    id: "trap_suspicious_phone",
    code: "WA1",
    title: "Número desconocido o con código de país extraño",
    description: "Un contacto que no tienes agendado se hace pasar por un amigo, banco o la escuela desde un número particular.",
    category: "messaging",
    app: "whatsapp"
  },
  {
    id: "trap_voice_note_curiosity",
    code: "WA2",
    title: "Nota de voz / Audio falso para generar curiosidad",
    description: "Envía un audio corto o una foto temporal para forzarte a abrir el chat o descargar archivos.",
    category: "messaging",
    app: "whatsapp"
  },
  {
    id: "trap_domain_spoof",
    code: "T1",
    title: "Dominio web o correo falso con error tipográfico",
    description: "Usa una dirección engañosa con letras cambiadas (ej: @coleg1o.edu.ar, @banconac1on.com).",
    category: "technical",
    app: "all"
  },
  {
    id: "trap_urgency_threat",
    code: "T2",
    title: "Urgencia extrema y amenaza de castigo o pérdida",
    description: "Presiona con un límite de tiempo (ej: 'Tenés 15 minutos') o amenaza con eliminar la cuenta.",
    category: "psychological",
    app: "all"
  },
  {
    id: "trap_fake_link",
    code: "T3",
    title: "Enlace engañoso a sitio web gratuito o no oficial",
    description: "El botón o enlace dirige a un hosting sospechoso (.xyz, .free.nf, .tk) para robar contraseñas.",
    category: "technical",
    app: "all"
  },
  {
    id: "trap_malicious_attachment",
    code: "T4",
    title: "Archivo adjunto ejecutable o peligroso (.exe, .scr)",
    description: "Disfraza un archivo ejecutable malicioso como si fuera una foto, video o documento.",
    category: "technical",
    app: "all"
  },
  {
    id: "trap_secret_isolation",
    code: "T5",
    title: "Instrucción de secreto (No avisar a nadie)",
    description: "Pide expresamente no consultar con profesores, directivos o padres para evitar que te ayuden.",
    category: "psychological",
    app: "all"
  }
];

const pvpThemes = [
  {
    id: "theme-instagram-dm",
    appType: "instagram",
    title: "📸 Instagram DM: Robo de Cuentas / Sorteo de Entradas",
    description: "Un mensaje privado de Instagram avisando sobre un video comprometedor o anunciando que ganaste entradas para un recital.",
    defaultUsername: "recitales_argentina_oficiall",
    defaultBio: "🎟️ Producción oficial de recitales y sorteos juveniles. 4 publicaciones · 12 seguidores",
    defaultMessage: "¡Felicitaciones! 🎉 Fuiste seleccionado/a como ganador/a de 2 entradas VIP. Para reclamarlas antes de las 20hs, confirmá tu cuenta acá:",
    defaultLink: "https://entradas-vip-reclamar.free.nf/login",
    suggestedTraps: ["trap_cloned_profile", "trap_dm_social_engineering", "trap_fake_link", "trap_urgency_threat"]
  },
  {
    id: "theme-whatsapp-chat",
    appType: "whatsapp",
    title: "💬 WhatsApp: Falso Compañero / Beca Estudiantil",
    description: "Un número desconocido se hace pasar por un compañero pidiendo un código SMS o una supuesta beca de $150.000.",
    defaultSender: "Beca Conectividad Estudiantil",
    defaultPhone: "+54 9 11 9876-5432",
    defaultMessage: "¡Hola! Te contactamos del programa de becas. Tenés un pago pendiente de $150.000 listo para transferir. Necesitamos que valides tu Token.",
    defaultLink: "https://becas-estudiantes.free.nf/activar",
    hasVoiceNote: true,
    suggestedTraps: ["trap_suspicious_phone", "trap_urgency_threat", "trap_fake_link", "trap_secret_isolation"]
  },
  {
    id: "theme-email-escuela",
    appType: "email",
    title: "📩 Correo Escolar: Falsa Notificación de la Dirección",
    description: "Un correo con logo escolar anunciando suspensión de clases o examen sorpresa exigiendo ingresar a un portal.",
    defaultSender: "Dirección Escolar",
    defaultAddress: "comunicados@coleg1o.edu.ar",
    defaultSubject: "⚠️ [URGENTE] Suspensión de clases y revalidación",
    defaultMessage: "Se informa que por problemas en la plataforma, todos los alumnos deben revalidar su matrícula hoy mismo.",
    defaultLink: "https://portal-colegio.free.nf/login",
    suggestedTraps: ["trap_domain_spoof", "trap_urgency_threat", "trap_fake_link", "trap_malicious_attachment"]
  }
];

const defaultCases = [
  {
    id: "caso-banco-phishing",
    title: "El correo del banco",
    subtitle: "Ataque de Phishing bancario con suplantación de identidad",
    type: "email",
    badge: "Phishing Bancario",
    difficulty: "Intermedio",
    description: "Un correo electrónico alarmante informa sobre un supuesto bloqueo de cuenta bancaria y exige una acción inmediata.",
    material: {
      fromName: "Banco Nación - Centro de Seguridad",
      fromEmail: "alertas-seguridad@banconac1on-verificacion.com",
      to: "usuario_estudiante@gmail.com",
      date: "Hoy, 09:41 AM",
      subject: "⚠️ [URGENTE] Acción requerida: Su cuenta ha sido bloqueada preventivamente",
      bannerText: "AVISO DE SEGURIDAD BANCARIA — NOTIFICACIÓN AUTOMÁTICA",
      bodyHtml: `
        <p>Estimado/a cliente,</p>
        <p>Le informamos que nuestro sistema de monitoreo automático ha detectado <strong>múltiples intentos de acceso no autorizados</strong> a su cuenta desde una dirección IP no habitual (<code>185.220.101.5 - Moscú, Rusia</code>).</p>
        <p>Por razones de estricta seguridad patrimonial, hemos procedido al <strong>bloqueo preventivo de sus tarjetas y transferencias</strong>.</p>
        <p style="background: rgba(255, 51, 102, 0.12); border-left: 4px solid #ff3366; padding: 12px; border-radius: 4px; color: #ff99aa;">
          <strong>ATENCIÓN:</strong> Dispone de un plazo máximo de <strong>24 HORAS</strong> para validar su identidad. De lo contrario, su cuenta será cancelada definitivamente y sus fondos quedarán inmovilizados.
        </p>
        <p>Para desbloquear su cuenta inmediatamente y restablecer el acceso a sus fondos, haga clic en el siguiente botón seguro:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="#" class="fake-link-btn" style="background: #0088ff; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0, 136, 255, 0.4);">
            🔒 VALIDAR MI IDENTIDAD Y DESBLOQUEAR CUENTA AHORA
          </a>
        </div>
        <p style="font-size: 0.85rem; color: #94a3b8;">
          Enlace alternativo de respaldo: <span class="fake-url-preview">https://banc0-login-verificar.xyz/auth/token?id=99281</span>
        </p>
        <p>Adjuntamos el informe oficial de incidentes de seguridad para su revisión.</p>
        <p style="margin-top: 24px;">Atentamente,<br><strong>Gerencia de Ciberseguridad & Prevención de Fraudes</strong><br>Banco de la Nación Argentina</p>
      `,
      attachment: {
        name: "Detalle_Bloqueo_Cta.exe",
        size: "1.4 MB",
        icon: "file-exe",
        warning: "Archivo ejecutable sospechoso"
      }
    },
    redTeamPrompt: {
      title: "Consigna de Ataque (Red Team)",
      subtitle: "¿Cómo armarían este engaño desde cero?",
      instructions: "Ustedes son el equipo de ciberdelincuentes (Red Team) que diseñó esta campaña. Expliquen la estrategia detrás del ataque:",
      fields: [
        { id: "story", label: "1. La historia y el pretexto", placeholder: "Expliquen la historia falsa..." },
        { id: "urgency", label: "2. El gancho de urgencia", placeholder: "¿Cómo manipularon el miedo?" },
        { id: "technical", label: "3. La trampa técnica", placeholder: "¿Qué trucos usaron?" }
      ]
    },
    blueTeamPrompt: {
      title: "Consigna de Defensa (Blue Team)",
      subtitle: "Detecten las señales de alerta y protejan a la organización",
      instructions: "Ustedes son los analistas de seguridad (Blue Team). Analicen minuciosamente el correo y seleccionen las 5 anomalías reales.",
      anomalyCount: 5,
      recommendationLimit: 3
    },
    anomalies: [
      { id: "anom-1", code: "A1", title: "Dominio falso en el remitente", isCorrect: true },
      { id: "anom-2", code: "A2", title: "Urgencia y amenaza de 24 horas", isCorrect: true },
      { id: "anom-3", code: "A3", title: "Saludo genérico e impersonal", isCorrect: true },
      { id: "anom-4", code: "A4", title: "Enlace con dominio engañoso (.xyz)", isCorrect: true },
      { id: "anom-5", code: "A5", title: "Archivo adjunto ejecutable malicioso (.exe)", isCorrect: true }
    ]
  },
  {
    id: "caso-whatsapp-beca",
    title: "WhatsApp de la beca falsa",
    subtitle: "Ataque de Smishing / Ingeniería social por mensajería instantánea",
    type: "whatsapp",
    badge: "Smishing WhatsApp",
    difficulty: "Principiante - Intermedio",
    description: "Un mensaje de WhatsApp de un supuesto programa de becas promete $150.000 pero exige validar datos bancarios en 30 minutos.",
    material: {
      contactName: "Programa Becas Juveniles 2026",
      contactNumber: "+54 9 11 9876-5432",
      contactStatus: "En línea",
      verified: false,
      avatarText: "PB",
      messages: [
        { id: "msg-1", sender: "other", time: "14:22", text: "¡Felicitaciones! 🎉 Has sido seleccionado/a para la Beca de Conectividad 2026 ($150.000 ARS)." },
        { id: "msg-2", sender: "other", time: "14:23", text: "⚠️ Tenés 30 minutos para confirmar la vacante antes de que sea reasignada." },
        { id: "msg-3", sender: "other", time: "14:24", text: "Para cobrar, ingresá tu Token bancario aquí: https://becas-estudiantiles-ar.free.nf/validar" },
        { id: "msg-4", sender: "other", time: "14:25", text: "ℹ️ Por favor NO consultes en la escuela para no saturar las líneas." }
      ]
    },
    redTeamPrompt: {
      title: "Consigna de Ataque (Red Team)",
      instructions: "Expliquen cómo planearon este ataque por WhatsApp."
    },
    blueTeamPrompt: {
      title: "Consigna de Defensa (Blue Team)",
      instructions: "Encuentren las 5 señales de alerta en la conversación."
    },
    anomalies: [
      { id: "anom-w1", code: "W1", title: "Número desconocido sin verificación oficial", isCorrect: true },
      { id: "anom-w2", code: "W2", title: "Presión de tiempo extrema (30 minutos)", isCorrect: true },
      { id: "anom-w3", code: "W3", title: "Solicitud de claves bancarias y Token", isCorrect: true },
      { id: "anom-w4", code: "W4", title: "Enlace web con hosting gratuito sospechoso (.free.nf)", isCorrect: true },
      { id: "anom-w5", code: "W5", title: "Pedido de secreto y no consultar con la escuela", isCorrect: true }
    ]
  }
];

// =============================================
// BUILDER MODE: Escenarios de Armado Individual
// =============================================

const builderScenarios = [
  {
    id: 'builder-whatsapp',
    appType: 'whatsapp',
    title: '💬 WhatsApp: Armá un Mensaje',
    description: 'Elegí los componentes para armar un mensaje de WhatsApp según el objetivo asignado.',
    categories: [
      {
        id: 'sender',
        icon: '📱',
        label: 'Remitente / Contacto',
        description: '¿Quién envía el mensaje?',
        options: [
          {
            id: 'sender_friend',
            label: 'Un amigo del colegio (guardado en agenda)',
            preview: { contactName: 'Nico 🏀', contactNumber: '+54 9 11 4532-1122' },
            score: { phishing: 5, legitimate: 20 },
            feedback: {
              phishing: '⚠️ Si el contacto ya está guardado, es más difícil que sospechen... pero no parece un remitente institucional.',
              legitimate: '✅ Perfecto. Un contacto conocido y guardado es totalmente legítimo.'
            }
          },
          {
            id: 'sender_unknown',
            label: 'Número desconocido (+54 9 11 XXXX)',
            preview: { contactName: '+54 9 11 6789-0000', contactNumber: '+54 9 11 6789-0000' },
            score: { phishing: 12, legitimate: 5 },
            feedback: {
              phishing: '⭐ Un número desconocido genera sospecha... pero es lo que usaría un estafador real.',
              legitimate: '⚠️ Un número no guardado parece sospechoso, no es la mejor opción para algo legítimo.'
            }
          },
          {
            id: 'sender_institution',
            label: 'Beca Conectividad Estudiantil 2026',
            preview: { contactName: 'Beca Conectividad Estudiantil 2026', contactNumber: '+54 9 11 9876-5432' },
            score: { phishing: 20, legitimate: 15 },
            feedback: {
              phishing: '🎯 ¡Excelente! Imitar una entidad oficial es la técnica más usada en phishing real. El nombre largo y formal genera confianza falsa.',
              legitimate: '✅ Correcto, un programa de becas real usaría un nombre institucional así.'
            }
          },
          {
            id: 'sender_company',
            label: 'Soporte Técnico MercadoPago',
            preview: { contactName: 'Soporte MercadoPago', contactNumber: '+54 9 11 3333-4444' },
            score: { phishing: 18, legitimate: 8 },
            feedback: {
              phishing: '🎯 Suplantar una empresa conocida (brand spoofing) es muy efectivo porque la gente confía en marcas.',
              legitimate: '⚠️ MercadoPago real no contacta así por WhatsApp, no es creíble como legítimo.'
            }
          }
        ]
      },
      {
        id: 'body',
        icon: '📝',
        label: 'Contenido del Mensaje',
        description: '¿Qué dice el mensaje?',
        options: [
          {
            id: 'body_casual',
            label: '¡Hola! ¿Venís mañana al colegio? Acordate del trabajo de historia.',
            score: { phishing: 3, legitimate: 20 },
            feedback: {
              phishing: '❌ Un mensaje casual no tiene gancho para que la víctima haga algo riesgoso.',
              legitimate: '✅ Natural y creíble. Así es un mensaje real entre compañeros.'
            }
          },
          {
            id: 'body_prize',
            label: '¡Felicitaciones! 🎉 Ganaste una beca de $150.000. Confirmá tus datos antes de las 18hs.',
            score: { phishing: 22, legitimate: 5 },
            feedback: {
              phishing: '🎯 ¡Perfecto! Combina premio + urgencia + pedido de datos. Los 3 pilares del phishing clásico.',
              legitimate: '❌ Nadie regala $150.000 así. Demasiado bueno para ser real.'
            }
          },
          {
            id: 'body_threat',
            label: '⚠️ Detectamos actividad sospechosa en tu cuenta. Si no verificás en 30 minutos, será suspendida.',
            score: { phishing: 25, legitimate: 3 },
            feedback: {
              phishing: '🎯 ¡Excelente! El miedo a perder la cuenta es el disparador emocional más potente. El límite de 30 min impide pensar.',
              legitimate: '❌ Las empresas reales no amenazan con tiempos tan cortos por WhatsApp.'
            }
          },
          {
            id: 'body_official',
            label: 'Informamos que el lunes 18/8 no habrá clases por jornada docente. Más info en el portal.',
            score: { phishing: 8, legitimate: 22 },
            feedback: {
              phishing: '⚠️ Es creíble pero no tiene un llamado a acción urgente que lleve al engaño.',
              legitimate: '✅ Formal, informativo y sin urgencia excesiva. Así se comunica una institución real.'
            }
          }
        ]
      },
      {
        id: 'link',
        icon: '🔗',
        label: 'Enlace en el Mensaje',
        description: '¿Qué enlace incluís?',
        options: [
          {
            id: 'link_none',
            label: 'Sin enlace (solo texto)',
            score: { phishing: 2, legitimate: 18 },
            feedback: {
              phishing: '❌ Sin enlace no podés robar datos. El enlace malicioso es esencial en phishing.',
              legitimate: '✅ Muchos mensajes reales no necesitan enlaces.'
            }
          },
          {
            id: 'link_official',
            label: 'https://www.argentina.gob.ar/becas',
            score: { phishing: 5, legitimate: 22 },
            feedback: {
              phishing: '⚠️ Un dominio .gob.ar real no te permite robar datos... a menos que la víctima no lo verifique.',
              legitimate: '✅ Un enlace a un dominio oficial del gobierno es completamente legítimo.'
            }
          },
          {
            id: 'link_suspicious',
            label: 'https://becas-estudiantes.free.nf/validar',
            score: { phishing: 22, legitimate: 3 },
            feedback: {
              phishing: '🎯 ¡Perfecto! Un hosting gratuito (.free.nf) es la señal técnica #1 de phishing. Los sitios reales no usan estos dominios.',
              legitimate: '❌ Ninguna institución real usa .free.nf. Es un hosting gratuito obvio.'
            }
          },
          {
            id: 'link_typo',
            label: 'https://mercad0pago-soporte.xyz/verificar',
            score: { phishing: 25, legitimate: 2 },
            feedback: {
              phishing: '🎯 ¡Excelente! Dominio con typosquatting (0 en vez de o) + extensión .xyz sospechosa. Trampa técnica de nivel avanzado.',
              legitimate: '❌ .xyz y errores tipográficos son señales evidentes de fraude.'
            }
          }
        ]
      },
      {
        id: 'tone',
        icon: '⏰',
        label: 'Tono y Urgencia',
        description: '¿Cómo es el tono del mensaje?',
        options: [
          {
            id: 'tone_neutral',
            label: 'Neutro y amigable, sin presión',
            score: { phishing: 3, legitimate: 22 },
            feedback: {
              phishing: '❌ Sin urgencia, la víctima tiene tiempo de pensar y consultar. El phishing necesita presión.',
              legitimate: '✅ Los mensajes reales no presionan. El tono neutro es profesional y creíble.'
            }
          },
          {
            id: 'tone_moderate',
            label: 'Plazo de 24-48hs para responder',
            score: { phishing: 15, legitimate: 15 },
            feedback: {
              phishing: '⭐ Un plazo moderado es creíble y genera cierta presión. Buen equilibrio.',
              legitimate: '✅ Un plazo razonable es normal en comunicaciones oficiales.'
            }
          },
          {
            id: 'tone_extreme',
            label: '¡URGENTE! Tenés 30 MINUTOS o se cancela todo',
            score: { phishing: 22, legitimate: 3 },
            feedback: {
              phishing: '🎯 ¡Perfecto! La urgencia extrema es la herramienta psicológica favorita de los estafadores. Impide que la víctima piense con claridad.',
              legitimate: '❌ Ninguna organización seria da plazos de 30 minutos. Esto grita "estafa".'
            }
          },
          {
            id: 'tone_secret',
            label: 'Confidencial: por favor no compartas esto con nadie',
            score: { phishing: 20, legitimate: 5 },
            feedback: {
              phishing: '🎯 El pedido de secreto aísla a la víctima. Si no puede consultar con otros, es más fácil engañarla.',
              legitimate: '⚠️ Pedir secreto es una enorme red flag. Las instituciones reales alientan a verificar.'
            }
          }
        ]
      },
      {
        id: 'technique',
        icon: '🎣',
        label: 'Técnica Especial',
        description: '¿Agregás algún elemento extra?',
        options: [
          {
            id: 'tech_none',
            label: 'Ninguna técnica extra',
            score: { phishing: 2, legitimate: 18 },
            feedback: {
              phishing: '⚠️ No agregaste ningún elemento extra. Los ataques sofisticados combinan múltiples técnicas.',
              legitimate: '✅ Un mensaje legítimo no necesita trucos adicionales.'
            }
          },
          {
            id: 'tech_voice',
            label: '🎤 Nota de voz simulada (genera curiosidad)',
            score: { phishing: 15, legitimate: 10 },
            feedback: {
              phishing: '⭐ Las notas de voz generan curiosidad y urgencia por abrir. Buena técnica de ingeniería social.',
              legitimate: '✅ Las notas de voz también se usan en mensajes reales, es creíble.'
            }
          },
          {
            id: 'tech_attachment',
            label: '📎 Archivo adjunto "Comprobante.pdf.exe"',
            score: { phishing: 20, legitimate: 2 },
            feedback: {
              phishing: '🎯 Disfrazar un ejecutable como PDF es una técnica clásica de malware. ¡Muy efectivo contra usuarios distraídos!',
              legitimate: '❌ Un archivo .exe es una señal de peligro inmediata. Nadie envía esto legítimamente.'
            }
          },
          {
            id: 'tech_impersonation',
            label: '🎭 Foto de perfil con logo oficial robado',
            score: { phishing: 18, legitimate: 8 },
            feedback: {
              phishing: '🎯 Usar logos oficiales robados (brand impersonation) aumenta mucho la credibilidad del engaño.',
              legitimate: '⭐ Un logo oficial real sí correspondería a una cuenta institucional.'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'builder-instagram',
    appType: 'instagram',
    title: '📸 Instagram DM: Armá un Mensaje Directo',
    description: 'Elegí los componentes para armar un DM de Instagram según el objetivo asignado.',
    categories: [
      {
        id: 'sender',
        icon: '👤',
        label: 'Perfil del Remitente',
        description: '¿Desde qué perfil mandás el DM?',
        options: [
          {
            id: 'sender_real_friend',
            label: '@juan_martinez03 (compañero real, 340 seguidores)',
            preview: { username: 'juan_martinez03', bio: 'Alumno 3ro B 🎸 | CNBA', followersCount: '340 seguidores' },
            score: { phishing: 5, legitimate: 20 },
            feedback: {
              phishing: '⚠️ Un perfil real es poco útil para phishing porque la víctima puede verificar con el dueño.',
              legitimate: '✅ Un compañero real con seguidores normales es completamente creíble.'
            }
          },
          {
            id: 'sender_cloned',
            label: '@duki_oficiall_entradas (12 seguidores, 4 posts)',
            preview: { username: 'duki_oficiall_entradas', bio: '🎟️ Sorteos oficiales Duki Tour 2026. 4 publicaciones · 12 seguidores', followersCount: '12 seguidores' },
            score: { phishing: 22, legitimate: 3 },
            feedback: {
              phishing: '🎯 ¡Perfecto! Perfil clonado con letras duplicadas (_oficiall_) y pocos seguidores. Técnica clásica de suplantación en Instagram.',
              legitimate: '❌ Un perfil con 12 seguidores y nombre sospechoso no es creíble como legítimo.'
            }
          },
          {
            id: 'sender_brand',
            label: '@colegio_sorteos_oficial (89 seguidores)',
            preview: { username: 'colegio_sorteos_oficial', bio: '🏫 Cuenta oficial de sorteos del colegio. 6 publicaciones · 89 seguidores', followersCount: '89 seguidores' },
            score: { phishing: 18, legitimate: 10 },
            feedback: {
              phishing: '🎯 Simular una cuenta institucional del colegio con "oficial" en el nombre es muy efectivo para engañar estudiantes.',
              legitimate: '⚠️ Una cuenta nueva de sorteos del colegio con pocos seguidores genera dudas.'
            }
          },
          {
            id: 'sender_verified',
            label: '@colegio_nacional_ba (2.1k seguidores, verificado ✓)',
            preview: { username: 'colegio_nacional_ba', bio: '🏫 Cuenta oficial del CNBA. 2.1k seguidores · Verificado ✓', followersCount: '2.1k seguidores' },
            score: { phishing: 8, legitimate: 22 },
            feedback: {
              phishing: '⚠️ Un perfil verificado con muchos seguidores es difícil de falsificar. No es la mejor opción para phishing.',
              legitimate: '✅ Un perfil verificado con buen número de seguidores es totalmente creíble.'
            }
          }
        ]
      },
      {
        id: 'body',
        icon: '💬',
        label: 'Contenido del DM',
        description: '¿Qué dice tu mensaje directo?',
        options: [
          {
            id: 'body_casual',
            label: '¡Ey! ¿Viste la tarea de mañana? Me pasás las consignas?',
            score: { phishing: 3, legitimate: 22 },
            feedback: {
              phishing: '❌ Sin gancho malicioso. Un DM casual no tiene objetivo de ataque.',
              legitimate: '✅ Un mensaje entre compañeros pidiendo tarea es completamente normal.'
            }
          },
          {
            id: 'body_video',
            label: '😱 ¿¿Sos vos en este video?? Mirá lo que están compartiendo de vos: ',
            score: { phishing: 25, legitimate: 2 },
            feedback: {
              phishing: '🎯 ¡Excelente! "Salís en este video" es el DM de phishing #1 en Instagram. Explota la vergüenza y curiosidad para que toques sin pensar.',
              legitimate: '❌ Este tipo de mensaje genera pánico. Nadie legítimo lo envía así.'
            }
          },
          {
            id: 'body_contest',
            label: '🎉 ¡Ganaste 2 entradas VIP para el recital! Confirmá tu cuenta para reclamarlas antes de las 20hs.',
            score: { phishing: 22, legitimate: 5 },
            feedback: {
              phishing: '🎯 Premio falso + plazo urgente. La emoción de ganar algo nubla el juicio crítico.',
              legitimate: '❌ Dar premios por DM sin concurso previo no es creíble.'
            }
          },
          {
            id: 'body_event',
            label: 'Recordá que mañana es la jornada de convivencia. Revisá el horario en la web del colegio.',
            score: { phishing: 5, legitimate: 20 },
            feedback: {
              phishing: '⚠️ Informativo y sin gancho. No hay motivación para que la víctima entregue datos.',
              legitimate: '✅ Una comunicación informativa del colegio, clara y sin presión.'
            }
          }
        ]
      },
      {
        id: 'link',
        icon: '🔗',
        label: 'Enlace en el DM',
        description: '¿Qué enlace incluís?',
        options: [
          {
            id: 'link_none',
            label: 'Sin enlace',
            score: { phishing: 2, legitimate: 18 },
            feedback: {
              phishing: '❌ Sin enlace no podés capturar credenciales.',
              legitimate: '✅ Los DMs reales entre amigos muchas veces no tienen enlaces.'
            }
          },
          {
            id: 'link_legit',
            label: 'https://www.instagram.com/colegio_nacional_ba',
            score: { phishing: 5, legitimate: 22 },
            feedback: {
              phishing: '⚠️ Un enlace a Instagram real no te sirve para robar datos.',
              legitimate: '✅ Enlace al perfil oficial real. Completamente legítimo.'
            }
          },
          {
            id: 'link_fake_login',
            label: 'https://1nstagram-login.free.nf/verify',
            score: { phishing: 25, legitimate: 2 },
            feedback: {
              phishing: '🎯 ¡Excelente! "1nstagram" con un 1 en vez de i + hosting .free.nf. Página de login falsa clásica para robar contraseñas.',
              legitimate: '❌ Un enlace con typo y hosting gratuito es una estafa obvia.'
            }
          },
          {
            id: 'link_shortener',
            label: 'https://bit.ly/3xK9mPq',
            score: { phishing: 18, legitimate: 8 },
            feedback: {
              phishing: '⭐ Los acortadores de URL ocultan el destino real. Técnica efectiva pero cada vez más conocida.',
              legitimate: '⚠️ Los acortadores generan desconfianza. Mejor usar la URL completa si es legítimo.'
            }
          }
        ]
      },
      {
        id: 'tone',
        icon: '⏰',
        label: 'Tono y Urgencia',
        description: '¿Cómo es el tono del DM?',
        options: [
          {
            id: 'tone_chill',
            label: 'Tranquilo y amigable',
            score: { phishing: 3, legitimate: 22 },
            feedback: {
              phishing: '❌ Sin presión, la víctima puede consultar con otros antes de actuar.',
              legitimate: '✅ El tono relajado es natural en conversaciones reales de Instagram.'
            }
          },
          {
            id: 'tone_fomo',
            label: '¡Solo quedan 3 entradas! Apurate 🔥🔥',
            score: { phishing: 22, legitimate: 5 },
            feedback: {
              phishing: '🎯 FOMO (Fear Of Missing Out) es una técnica psicológica muy efectiva, especialmente con jóvenes.',
              legitimate: '❌ La presión extrema con emojis de fuego no es profesional.'
            }
          },
          {
            id: 'tone_shame',
            label: 'Esto es privado, no se lo muestres a nadie 🤫',
            score: { phishing: 20, legitimate: 3 },
            feedback: {
              phishing: '🎯 El secreto aísla a la víctima. Si no puede preguntar a nadie, no puede verificar la trampa.',
              legitimate: '❌ Pedir secreto es una de las mayores red flags en ciberseguridad.'
            }
          },
          {
            id: 'tone_formal',
            label: 'Le informamos oportunamente. Atte. La Dirección.',
            score: { phishing: 10, legitimate: 18 },
            feedback: {
              phishing: '⭐ Un tono formal puede funcionar para suplantación institucional.',
              legitimate: '✅ Un tono formal y respetuoso es propio de comunicaciones oficiales.'
            }
          }
        ]
      },
      {
        id: 'technique',
        icon: '🎣',
        label: 'Técnica Especial',
        description: '¿Agregás algún truco extra?',
        options: [
          {
            id: 'tech_none',
            label: 'Sin técnica extra',
            score: { phishing: 2, legitimate: 18 },
            feedback: {
              phishing: '⚠️ Sin técnicas extras, el ataque pierde sofisticación.',
              legitimate: '✅ Un mensaje normal no necesita trucos.'
            }
          },
          {
            id: 'tech_fake_verified',
            label: '✓ Emoji de verificado falso en el nombre',
            score: { phishing: 18, legitimate: 5 },
            feedback: {
              phishing: '🎯 Poner un emoji ✓ en el nombre imita la verificación real. Muchos caen en esto.',
              legitimate: '❌ Usar un emoji de verificado falso delata que no es una cuenta real.'
            }
          },
          {
            id: 'tech_story_mention',
            label: '📸 "Te mencioné en mi historia, fijate"',
            score: { phishing: 20, legitimate: 8 },
            feedback: {
              phishing: '🎯 Mencionar stories genera urgencia por ir a ver. Excelente hook de ingeniería social.',
              legitimate: '⭐ Las menciones en historias son comunes, pero acompañar con link sospechoso arruina la credibilidad.'
            }
          },
          {
            id: 'tech_multiple_accounts',
            label: '🔄 "Si no te llega, probá desde @backup_oficial"',
            score: { phishing: 15, legitimate: 3 },
            feedback: {
              phishing: '⭐ Redirigir a otra cuenta falsa es una técnica para evadir bloqueos y reportes.',
              legitimate: '❌ Ninguna institución real pide que uses una cuenta "backup".'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'builder-email',
    appType: 'email',
    title: '📩 Email: Armá un Correo Electrónico',
    description: 'Elegí los componentes para armar un correo electrónico según el objetivo asignado.',
    categories: [
      {
        id: 'sender',
        icon: '✉️',
        label: 'Remitente del Correo',
        description: '¿Desde qué dirección se envía?',
        options: [
          {
            id: 'sender_legit_edu',
            label: 'comunicados@colegio.edu.ar (dominio real)',
            preview: { fromName: 'Dirección Escolar', fromEmail: 'comunicados@colegio.edu.ar' },
            score: { phishing: 5, legitimate: 22 },
            feedback: {
              phishing: '⚠️ Un dominio .edu.ar real es muy difícil de falsificar. No es práctico para phishing.',
              legitimate: '✅ Un dominio educativo real es la dirección más confiable posible.'
            }
          },
          {
            id: 'sender_typo',
            label: 'alertas@coleg1o-verificacion.com (con errores)',
            preview: { fromName: 'Dirección Escolar - Seguridad', fromEmail: 'alertas@coleg1o-verificacion.com' },
            score: { phishing: 22, legitimate: 2 },
            feedback: {
              phishing: '🎯 ¡Excelente! El "1" en vez de "i" (typosquatting) + dominio genérico .com es la combinación clásica de email spoofing.',
              legitimate: '❌ Un dominio con errores tipográficos es una señal obvia de fraude.'
            }
          },
          {
            id: 'sender_free',
            label: 'becas_argentina2026@gmail.com (email gratuito)',
            preview: { fromName: 'Programa Nacional de Becas', fromEmail: 'becas_argentina2026@gmail.com' },
            score: { phishing: 18, legitimate: 5 },
            feedback: {
              phishing: '🎯 Usar Gmail para hacerse pasar por una institución es sospechoso pero muchos no lo notan.',
              legitimate: '❌ Una institución real nunca usaría un email @gmail.com para comunicaciones oficiales.'
            }
          },
          {
            id: 'sender_profe',
            label: 'prof.garcia@colegio.edu.ar (docente real)',
            preview: { fromName: 'Prof. García - Informática', fromEmail: 'prof.garcia@colegio.edu.ar' },
            score: { phishing: 8, legitimate: 20 },
            feedback: {
              phishing: '⚠️ Suplantar a un docente real puede funcionar pero es fácilmente verificable.',
              legitimate: '✅ Un email de un docente con dominio real es completamente creíble.'
            }
          }
        ]
      },
      {
        id: 'body',
        icon: '📝',
        label: 'Asunto y Contenido',
        description: '¿De qué trata el correo?',
        options: [
          {
            id: 'body_info',
            label: 'Recordatorio: Entrega de boletines el viernes. Retirá en secretaría de 8 a 12hs.',
            score: { phishing: 3, legitimate: 22 },
            feedback: {
              phishing: '❌ Un aviso informativo sin links ni pedidos de datos no sirve para phishing.',
              legitimate: '✅ Comunicado típico de secretaría. Claro, conciso e informativo.'
            }
          },
          {
            id: 'body_block',
            label: '⚠️ URGENTE: Tu cuenta educativa fue bloqueada. Ingresá tus datos para reactivarla.',
            score: { phishing: 25, legitimate: 3 },
            feedback: {
              phishing: '🎯 ¡Excelente! Amenaza de bloqueo + pedido de credenciales es la fórmula más efectiva de phishing por email.',
              legitimate: '❌ Las instituciones nunca piden datos sensibles por email con urgencia extrema.'
            }
          },
          {
            id: 'body_prize',
            label: '🎉 Fuiste seleccionado para una beca de $200.000. Completá el formulario adjunto.',
            score: { phishing: 20, legitimate: 5 },
            feedback: {
              phishing: '🎯 Un premio inesperado genera emoción que anula el pensamiento crítico.',
              legitimate: '❌ Las becas reales no aparecen así de la nada en un email.'
            }
          },
          {
            id: 'body_schedule',
            label: 'Se informa el cambio de horario del lunes: Matemáticas pasa de 8 a 10hs. Atte. Dirección.',
            score: { phishing: 5, legitimate: 20 },
            feedback: {
              phishing: '⚠️ Sin llamado a acción urgente, este contenido no motiva a la víctima a entregar datos.',
              legitimate: '✅ Un cambio de horario comunicado por email es totalmente normal y creíble.'
            }
          }
        ]
      },
      {
        id: 'link',
        icon: '🔗',
        label: 'Enlace o Adjunto',
        description: '¿Qué incluís en el correo?',
        options: [
          {
            id: 'link_none',
            label: 'Sin enlaces ni adjuntos',
            score: { phishing: 2, legitimate: 18 },
            feedback: {
              phishing: '❌ Sin enlace ni adjunto, no hay vector de ataque.',
              legitimate: '✅ Muchos emails informativos no necesitan enlaces.'
            }
          },
          {
            id: 'link_official',
            label: 'https://www.colegio.edu.ar/horarios (portal real)',
            score: { phishing: 5, legitimate: 22 },
            feedback: {
              phishing: '⚠️ Un enlace al portal real del colegio no te permite robar datos.',
              legitimate: '✅ Enlace al portal educativo real. Totalmente legítimo y verificable.'
            }
          },
          {
            id: 'link_fake_portal',
            label: 'https://portal-colegio.free.nf/login (portal falso)',
            score: { phishing: 22, legitimate: 2 },
            feedback: {
              phishing: '🎯 Un portal falso en hosting gratuito que imita el login real. Vector de ataque clásico.',
              legitimate: '❌ Un hosting .free.nf no es creíble como portal educativo.'
            }
          },
          {
            id: 'link_exe',
            label: '📎 Adjunto: "Boletín_2026.pdf.exe" (1.4 MB)',
            score: { phishing: 25, legitimate: 2 },
            feedback: {
              phishing: '🎯 ¡Excelente! Doble extensión (.pdf.exe) es la técnica más peligrosa. Parece un PDF pero ejecuta malware.',
              legitimate: '❌ Un archivo .exe disfrazado es el indicador más claro de malware.'
            }
          }
        ]
      },
      {
        id: 'tone',
        icon: '⏰',
        label: 'Tono y Urgencia',
        description: '¿Cómo es el tono del correo?',
        options: [
          {
            id: 'tone_neutral',
            label: 'Informativo y profesional, sin presión',
            score: { phishing: 3, legitimate: 22 },
            feedback: {
              phishing: '❌ Sin urgencia, la víctima puede verificar con la secretaría antes de actuar.',
              legitimate: '✅ El tono profesional sin presión es lo esperado en un email institucional.'
            }
          },
          {
            id: 'tone_deadline',
            label: 'Tienen hasta el viernes para completar el trámite',
            score: { phishing: 12, legitimate: 18 },
            feedback: {
              phishing: '⭐ Un plazo razonable genera cierta urgencia sin ser sospechoso.',
              legitimate: '✅ Plazos razonables son comunes en comunicaciones administrativas.'
            }
          },
          {
            id: 'tone_threat',
            label: 'ÚLTIMA ADVERTENCIA: 24hs o se elimina tu matrícula',
            score: { phishing: 22, legitimate: 3 },
            feedback: {
              phishing: '🎯 La amenaza de eliminar la matrícula genera pánico. El estudiante actúa sin pensar.',
              legitimate: '❌ Ninguna institución amenaza con eliminar matrículas en 24hs por email.'
            }
          },
          {
            id: 'tone_confidential',
            label: 'Este email es confidencial. No reenvíes ni consultes.',
            score: { phishing: 20, legitimate: 5 },
            feedback: {
              phishing: '🎯 Pedir confidencialidad aísla a la víctima. Sin ayuda externa, es más vulnerable.',
              legitimate: '⚠️ Pedir que no consultes es una enorme red flag. Las instituciones transparentes no hacen esto.'
            }
          }
        ]
      },
      {
        id: 'technique',
        icon: '🎣',
        label: 'Técnica Especial',
        description: '¿Usás alguna técnica adicional?',
        options: [
          {
            id: 'tech_none',
            label: 'Sin técnica extra',
            score: { phishing: 2, legitimate: 18 },
            feedback: {
              phishing: '⚠️ Un email sin técnicas extras es menos convincente.',
              legitimate: '✅ Los emails legítimos no necesitan artificios.'
            }
          },
          {
            id: 'tech_logo',
            label: '🏛️ Logo oficial del colegio en el encabezado',
            score: { phishing: 18, legitimate: 15 },
            feedback: {
              phishing: '🎯 Copiar el logo oficial aumenta enormemente la credibilidad del email falso.',
              legitimate: '✅ Un email institucional real incluye el logo del colegio.'
            }
          },
          {
            id: 'tech_cc',
            label: '📋 CC a "directora@colegio.edu.ar" (falso)',
            score: { phishing: 15, legitimate: 8 },
            feedback: {
              phishing: '⭐ Poner en copia a la "directora" da apariencia de comunicación oficial interna.',
              legitimate: '⭐ Incluir autoridades en copia es normal, pero verificá que el email sea real.'
            }
          },
          {
            id: 'tech_tracking',
            label: '🔍 Pixel de seguimiento invisible en el email',
            score: { phishing: 20, legitimate: 2 },
            feedback: {
              phishing: '🎯 Los tracking pixels permiten saber si la víctima abrió el email. Técnica avanzada de reconocimiento.',
              legitimate: '❌ Los pixels de tracking son invasivos y no corresponden a comunicaciones legítimas escolares.'
            }
          }
        ]
      }
    ]
  }
];

module.exports = {
  defaultCases,
  pvpTrapsCatalog,
  pvpThemes,
  builderScenarios
};
