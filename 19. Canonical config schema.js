var CANONICAL_CONFIG_VERSION = 'canonical-1-link-v1';

var CANONICAL_CONFIG_SHEETS = {
  README: 'README',
  CORE: 'CONFIG_CORE',
  HEADER_MAP: 'CONFIG_HEADER_MAP',
  VALIDATION: 'CONFIG_VALIDATION',
  FORMAT: 'CONFIG_FORMAT',
  MIGRATION: 'MIGRATION_MAP'
};

var CONFIG_SCHEMA = {
  version: CANONICAL_CONFIG_VERSION,
  requiredRuntimeSheets: [
    CANONICAL_CONFIG_SHEETS.CORE,
    CANONICAL_CONFIG_SHEETS.HEADER_MAP,
    CANONICAL_CONFIG_SHEETS.VALIDATION,
    CANONICAL_CONFIG_SHEETS.FORMAT
  ],
  optionalSheets: [
    CANONICAL_CONFIG_SHEETS.MIGRATION,
    CANONICAL_CONFIG_SHEETS.README
  ],
  coreColumns: ['group', 'key', 'value', 'type', 'required', 'default', 'note'],
  headerMapColumns: ['logical_name', 'column_letter', 'required', 'block', 'note'],
  validationColumns: ['target_column', 'start_row', 'validation_type', 'source_sheet', 'source_range', 'source_values', 'allow_invalid', 'required_for_task', 'note'],
  formatColumns: ['target_column', 'start_row', 'format_type', 'number_format', 'round_to', 'required', 'note'],
  migrationColumns: ['old_group', 'old_key', 'new_sheet', 'new_field', 'decision', 'note'],
  supportedTypes: ['STRING', 'NUMBER', 'BOOLEAN', 'LIST', 'REGEX'],
  supportedValidationTypes: ['DROPDOWN', 'DATE'],
  supportedFormatTypes: ['DATE', 'MONEY', 'PERCENT'],
  coreGroups: {
    SYSTEM_CORE: {
      department_code: { type: 'STRING', required: true, default: null },
      config_sheet_name: { type: 'STRING', required: true, default: 'Config' },
      data_sheet_name: { type: 'STRING', required: true, default: 'Data' },
      header_row: { type: 'NUMBER', required: true, default: 5 },
      first_data_row: { type: 'NUMBER', required: true, default: 6 },
      month_sheet_display_pattern: { type: 'STRING', required: true, default: null },
      month_sheet_regex: { type: 'REGEX', required: true, default: null },
      plan_year: { type: 'NUMBER', required: true, default: 2026 },
      template_type: { type: 'STRING', required: true, default: 'MAU_CHUAN_V1' }
    },
    SHEET_RULE: {
      month_sheet_rename_allowed: { type: 'BOOLEAN', required: true, default: false },
      extra_sheet_allowed: { type: 'BOOLEAN', required: true, default: false },
      require_full_12_month_sheets: { type: 'BOOLEAN', required: true, default: true },
      month_sheet_department_name_must_match: { type: 'BOOLEAN', required: true, default: true }
    },
    BUSINESS_RULE_MIN: {
      task_row_required_stt_type: { type: 'STRING', required: true, default: 'TASK_ONLY' },
      group_row_included_in_sync: { type: 'BOOLEAN', required: true, default: false },
      summary_row_included_in_sync: { type: 'BOOLEAN', required: true, default: false },
      valid_task_min_required_fields: { type: 'LIST', required: true, default: [] },
      allow_internal_task_without_project: { type: 'BOOLEAN', required: true, default: true },
      new_project_label: { type: 'STRING', required: true, default: 'M\u1edbi' },
      task_owner_required: { type: 'BOOLEAN', required: true, default: true },
      collaborator_optional: { type: 'BOOLEAN', required: true, default: true },
      due_date_required_for_task: { type: 'BOOLEAN', required: true, default: true },
      due_date_outside_month_allowed: { type: 'BOOLEAN', required: true, default: true },
      note_required_if_due_outside_month: { type: 'BOOLEAN', required: true, default: true },
      summary_row_symbol: { type: 'STRING', required: true, default: '\u2211' },
      task_level_max: { type: 'NUMBER', required: false, default: 4 },
      accepted_evaluation_values: { type: 'LIST', required: false, default: [] },
      accepted_progress_values: { type: 'LIST', required: false, default: [] }
    }
  },
  allowedHeaderLogicalNames: [
    'stt',
    'task_name',
    'project_code',
    'address',
    'category',
    'due_date',
    'owner',
    'collaborator',
    'note',
    'evaluation',
    'progress',
    'summary_marker',
    'extra_task_marker'
  ]
};

var CONFIG_DEFAULTS = {
  version: CANONICAL_CONFIG_VERSION,
  system: {
    config_sheet_name: 'Config',
    data_sheet_name: 'Data',
    header_row: 5,
    first_data_row: 6,
    plan_year: 2026,
    template_type: 'MAU_CHUAN_V1'
  },
  sheetRule: {
    month_sheet_rename_allowed: false,
    extra_sheet_allowed: false,
    require_full_12_month_sheets: true,
    month_sheet_department_name_must_match: true
  },
  businessRule: {
    task_row_required_stt_type: 'TASK_ONLY',
    group_row_included_in_sync: false,
    summary_row_included_in_sync: false,
    allow_internal_task_without_project: true,
    new_project_label: 'M\u1edbi',
    task_owner_required: true,
    collaborator_optional: true,
    due_date_required_for_task: true,
    due_date_outside_month_allowed: true,
    note_required_if_due_outside_month: true,
    summary_row_symbol: '\u2211',
    task_level_max: 4,
    valid_task_min_required_fields: [],
    accepted_evaluation_values: [],
    accepted_progress_values: []
  }
};

var DEPRECATED_KEY_MAP = {
  'SYSTEM.month_sheet_name_pattern': 'SYSTEM_CORE.month_sheet_display_pattern',
  'VALIDATION.owner_column + DATA_RULE.owner_source': 'CONFIG_VALIDATION[target_column=H]',
  'VALIDATION.collaborator_column + DATA_RULE.collaborator_source': 'CONFIG_VALIDATION[target_column=I]',
  'VALIDATION.due_date_column': 'CONFIG_VALIDATION[target_column=F]',
  'VALIDATION.evaluation_column + DATA_RULE.evaluation_range': 'CONFIG_VALIDATION[target_column=M]',
  'HEADER_MAP.col_*': 'CONFIG_HEADER_MAP',
  'FORMAT_F/FORMAT_G/FORMAT_K/FORMAT_L': 'CONFIG_FORMAT'
};
