/* Configuração pública dos módulos (sem segredos). Tracking 'direct' com IDs null: nenhum script externo carrega. */
window.CS_CONFIG = {
  siteId: 'bulldog-flooring',
  lead: {
    endpoint: '/api/lead.php',
    redirect: '/thank-you/',
    smsConsentVersion: 'sms-v1-2026-10-22'
  },
  serviceArea: { zips: [], outOfArea: 'accept-with-message' },
  tracking: {
    mode: 'direct',
    ga4: null,
    metaPixel: null,
    googleAds: null,
    gtm: null,
    consentDefault: 'granted',
    leadValue: null,
    debugParam: 'cs_debug'
  }
};

// preview copy: the form is simulated and nothing is tracked
window.CS_CONFIG = Object.assign({}, window.CS_CONFIG, { preview: true });
window.CS_CONFIG.lead = Object.assign({}, window.CS_CONFIG.lead, { endpoint: '/bulldog-flooring-preview/api/lead.php', redirect: null });
window.CS_CONFIG.tracking = Object.assign({}, window.CS_CONFIG.tracking, { mode: 'off', ga4: null, metaPixel: null, googleAds: null, gtm: null });
