#!/usr/bin/env node

/**
 * Conformance Test Runner.
 * Validates that:
 * 1. Valid test-suite cases PASS validation.
 * 2. Invalid test-suite cases FAIL validation.
 * 3. The official examples/ files in the repository PASS validation (preventing doc drift).
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m'
};

const validatorPath = path.join(__dirname, 'validate-spec.js');

const testCases = [];

const addTestsFromDir = (dirPath, relativeDir, expectPass) => {
  const absoluteDir = path.resolve(__dirname, '..', dirPath);
  if (fs.existsSync(absoluteDir)) {
    fs.readdirSync(absoluteDir).forEach(file => {
      if (file.endsWith('.json')) {
        testCases.push({ file: `${relativeDir}/${file}`, expectPass });
      }
    });
  }
};

addTestsFromDir('test-suite/valid', 'test-suite/valid', true);
addTestsFromDir('test-suite/invalid', 'test-suite/invalid', false);
addTestsFromDir('examples', 'examples', true);

let failed = false;

console.log(`${colors.bold}Starting AGE Observability Conformance Tests...${colors.reset}\n`);

testCases.forEach(tc => {
  const filePath = path.resolve(__dirname, '..', tc.file);
  
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}❌ Error: Test file not found: ${tc.file}${colors.reset}`);
    failed = true;
    return;
  }

  // Run the validator CLI tool
  const result = spawnSync('node', [validatorPath, filePath]);
  const passed = result.status === 0;
  
  if (passed === tc.expectPass) {
    console.log(`  ✅ ${colors.green}PASS${colors.reset} - ${tc.file} (Expected: ${tc.expectPass ? 'PASS' : 'FAIL'}, Got: ${passed ? 'PASS' : 'FAIL'})`);
  } else {
    console.error(`  ❌ ${colors.red}FAIL${colors.reset} - ${tc.file} (Expected: ${tc.expectPass ? 'PASS' : 'FAIL'}, Got: ${passed ? 'PASS' : 'FAIL'})`);
    console.error(`${colors.bold}Validator stdout/stderr for failed case:${colors.reset}`);
    console.error(result.stdout.toString());
    console.error(result.stderr.toString());
    failed = true;
  }
});

console.log('\n----------------------------------------');
if (failed) {
  console.log(`${colors.red}${colors.bold}❌ Conformance Test Suite Failed.${colors.reset}`);
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}✓ All Conformance Tests Passed successfully!${colors.reset}`);
  process.exit(0);
}
