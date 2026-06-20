#!/usr/bin/env node

/**
 * CLI Validation Tool for the AGE Observability Specification.
 * Validates a span JSON payload for required and recommended attributes.
 * 
 * Usage: node tools/validate-spec.js <path-to-span-json>
 */

const fs = require('fs');
const path = require('path');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(`${colors.red}Error: No input file specified.${colors.reset}`);
    console.log(`Usage: node ${path.basename(__filename)} <path-to-span-json>`);
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`${colors.red}Error: File not found at ${absolutePath}${colors.reset}`);
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(absolutePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`${colors.red}Error: Failed to parse JSON file: ${err.message}${colors.reset}`);
    process.exit(1);
  }

  const result = validateSpan(data);

  console.log(`\n${colors.bold}=== AGE Observability Spec Validation Report ===${colors.reset}`);
  console.log(`File: ${filePath}`);
  console.log(`Trace ID: ${data.traceId || 'N/A'}`);
  console.log(`Span ID:  ${data.spanId || 'N/A'}`);
  console.log(`Name:     ${data.name || 'N/A'}\n`);

  if (result.errors.length > 0) {
    console.log(`${colors.red}${colors.bold}[FAIL] Verification failed with ${result.errors.length} error(s):${colors.reset}`);
    result.errors.forEach(err => console.log(`  ❌ ${colors.red}${err}${colors.reset}`));
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✓ [PASS] All required attributes and types are valid!${colors.reset}`);
  }

  if (result.warnings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}Warnings (${result.warnings.length}):${colors.reset}`);
    result.warnings.forEach(warn => console.log(`  ⚠  ${colors.yellow}${warn}${colors.reset}`));
  }

  console.log(`\n${colors.cyan}Validation completed successfully.${colors.reset}\n`);
  process.exit(0);
}

function validateSpan(span) {
  const errors = [];
  const warnings = [];

  // 1. Root level checks
  if (!span.traceId) errors.push("Missing root 'traceId'");
  else if (typeof span.traceId !== 'string' || !/^[0-9a-fA-F]{32}$/.test(span.traceId)) {
    errors.push("Invalid 'traceId'. Must be a 32-character hex string.");
  }

  if (!span.spanId) errors.push("Missing root 'spanId'");
  else if (typeof span.spanId !== 'string' || !/^[0-9a-fA-F]{16}$/.test(span.spanId)) {
    errors.push("Invalid 'spanId'. Must be a 16-character hex string.");
  }

  if (!span.name || typeof span.name !== 'string') {
    errors.push("Missing or invalid root 'name' (must be a non-empty string)");
  }

  if (!span.attributes) {
    errors.push("Missing root 'attributes' object or array");
    return { errors, warnings };
  }

  // 2. Extract and normalize attributes
  const attrs = {};
  if (Array.isArray(span.attributes)) {
    // Standard OTel format: [{"key": "x", "value": {"stringValue": "y"}}]
    span.attributes.forEach((attr, idx) => {
      if (!attr.key || attr.value === undefined) {
        errors.push(`Invalid OTel attribute structure at index ${idx}. Must contain 'key' and 'value'.`);
        return;
      }
      
      const key = attr.key;
      const valObj = attr.value;
      let val = null;

      if (valObj && typeof valObj === 'object') {
        if ('stringValue' in valObj) val = valObj.stringValue;
        else if ('doubleValue' in valObj) val = valObj.doubleValue;
        else if ('intValue' in valObj) val = Number(valObj.intValue);
        else if ('boolValue' in valObj) val = valObj.boolValue;
        else val = JSON.stringify(valObj);
      } else {
        val = valObj;
      }
      
      attrs[key] = val;
    });
  } else if (typeof span.attributes === 'object' && span.attributes !== null) {
    // Flat format: {"x": "y"}
    Object.assign(attrs, span.attributes);
  } else {
    errors.push("Root 'attributes' must be an array (OTel Standard) or an object (Flat Format)");
    return { errors, warnings };
  }

  // 3. Define specifications for attributes
  const spec = {
    // Required attributes
    'ai.model.name': { required: true, type: 'string' },
    'ai.agent.id': { required: true, type: 'string' },
    'ai.intent.goal': { required: true, type: 'string' },
    'ai.physical.command': { required: true, type: 'string' },
    'physical.sensor.target': { required: true, type: 'string' },
    'physical.telemetry.deviation': { required: true, type: 'number' },
    'physical.action.status': { required: true, type: 'string' },
    'ai.human.intervention': { required: true, type: 'boolean' },

    // Recommended attributes
    'ai.model.version': { required: false, type: 'string', recommended: true },
    'ai.model.confidence': { required: false, type: 'number', recommended: true },
    'ai.simulation.type': { required: false, type: 'string', recommended: true },
    'ai.simulation.result': { required: false, type: 'string', recommended: true, enum: ['passed', 'failed'] },
    'ai.intent.plan_step': { required: false, type: 'string', recommended: true },
    'industrial.protocol': { required: false, type: 'string', recommended: true },
    'physical.action.duration_ms': { required: false, type: 'number', recommended: true },
    'physical.anomaly.type': { required: false, type: 'string', recommended: true },
    'physical.anomaly.severity': { required: false, type: 'string', recommended: true, enum: ['info', 'warning', 'critical'] },
    'physical.test.session_id': { required: false, type: 'string', recommended: true },
    'physical.test.operator_mode': { required: false, type: 'string', recommended: true },
    'ai.human.alteration': { required: false, type: 'string', recommended: true },
    'external.interaction.type': { required: false, type: 'string', recommended: true }
  };

  // 4. Validate attributes
  for (const [key, rules] of Object.entries(spec)) {
    const val = attrs[key];

    if (val === undefined || val === null) {
      if (rules.required) {
        errors.push(`Missing required attribute: '${key}'`);
      } else if (rules.recommended) {
        warnings.push(`Missing recommended attribute: '${key}'`);
      }
      continue;
    }

    // Type validation
    const actualType = typeof val;
    if (rules.type === 'number' && actualType !== 'number') {
      errors.push(`Type mismatch for '${key}': Expected number, got ${actualType} ("${val}")`);
    } else if (rules.type === 'string' && actualType !== 'string') {
      errors.push(`Type mismatch for '${key}': Expected string, got ${actualType}`);
    } else if (rules.type === 'boolean' && actualType !== 'boolean') {
      errors.push(`Type mismatch for '${key}': Expected boolean, got ${actualType} ("${val}")`);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(val)) {
      errors.push(`Value error for '${key}': Must be one of [${rules.enum.join(', ')}], got "${val}"`);
    }
  }

  return { errors, warnings };
}

if (require.main === module) {
  main();
}
