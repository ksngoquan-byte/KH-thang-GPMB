function validateConfigLegacy() {
  var cfg = loadCanonicalConfigLegacy_();
  validateCanonicalConfigLegacy_(cfg);
  Logger.log('validateConfigLegacy OK | version=%s', cfg.version);
  return {
    ok: true,
    version: cfg.version,
    defaultsApplied: cfg.defaultsApplied,
    deprecatedWarnings: cfg.deprecatedWarnings,
    unknownWarnings: cfg.unknownWarnings
  };
}

function testLoadCanonicalConfigLegacy_() {
  var cfg = loadCanonicalConfigLegacy_();
  Logger.log('testLoadCanonicalConfigLegacy_ => %s', JSON.stringify({
    version: cfg.version,
    system: cfg.system,
    sheetRule: cfg.sheetRule,
    businessRule: cfg.businessRule,
    headerMapKeys: Object.keys(cfg.headerMap || {}),
    validationRuleCount: (cfg.validationRules || []).length,
    formatRuleCount: (cfg.formatRules || []).length,
    defaultsApplied: (cfg.defaultsApplied || []).length,
    deprecatedWarnings: (cfg.deprecatedWarnings || []).length,
    unknownWarnings: (cfg.unknownWarnings || []).length
  }));
  return cfg;
}
