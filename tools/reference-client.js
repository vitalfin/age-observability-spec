/**
 * Reference Implementation: AGE Observability Telemetry Generator (Node.js)
 * 
 * This file serves as a reference showing how an application or edge agent
 * programmatically generates a trace span that complies with the AGE Observability Specification,
 * and how it can be validated prior to transmission.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Mocking inputs from a Physical AI Decision and Execution cycle
const mockSession = {
  sessionId: 'session_20260620_10',
  operatorMode: 'autonomous',
  aiModel: {
    name: 'prometheus-age-v1',
    version: '1.2.0',
    confidence: 0.95
  },
  agentId: 'milling-agent-01',
  goal: 'high_precision_milling',
  planStep: 'step_3_milling'
};

// Simulated sensor read loop
function executeCncCommand(command, targetRpm) {
  console.log(`Executing physical command '${command}' on target spindle...`);
  
  // Real world simulation: spindle runs, heats up, has some mechanical deflection
  const actualRpm = targetRpm + (Math.random() * 40 - 20); // random drift
  const deviation = Math.abs(targetRpm - actualRpm);
  
  return {
    actualRpm,
    deviation, // physical.telemetry.deviation
    durationMs: 12500, // physical.action.duration_ms
    status: 'completed', // physical.action.status
    anomalyDetected: deviation > 15.0,
    anomalyType: deviation > 15.0 ? 'thermal_expansion' : null
  };
}

function generateSpanPayload() {
  const targetRpm = 8000;
  const execution = executeCncCommand('SET_RPM', targetRpm);
  
  // Construct standard trace ids
  const traceId = crypto.randomBytes(16).toString('hex');
  const spanId = crypto.randomBytes(8).toString('hex');
  const startTime = Date.now() - execution.durationMs;
  const endTime = Date.now();

  // 2. Build the trace span JSON matching standard OTel structure
  const span = {
    traceId: traceId,
    spanId: spanId,
    name: 'CNC Milling Command Cycle',
    kind: 'SPAN_KIND_INTERNAL',
    startTimeUnixNano: startTime * 1000000,
    endTimeUnixNano: endTime * 1000000,
    attributes: [
      // AI model & simulation context
      { key: 'ai.model.name', value: { stringValue: mockSession.aiModel.name } },
      { key: 'ai.model.version', value: { stringValue: mockSession.aiModel.version } },
      { key: 'ai.model.confidence', value: { doubleValue: mockSession.aiModel.confidence } },
      { key: 'ai.agent.id', value: { stringValue: mockSession.agentId } },
      { key: 'ai.simulation.type', value: { stringValue: 'thermodynamics' } },
      { key: 'ai.simulation.result', value: { stringValue: 'passed' } },
      
      // Intent namespace
      { key: 'ai.intent.goal', value: { stringValue: mockSession.goal } },
      { key: 'ai.intent.plan_step', value: { stringValue: mockSession.planStep } },
      
      // Control & Protocol namespace
      { key: 'ai.physical.command', value: { stringValue: 'SET_RPM' } },
      { key: 'physical.sensor.target', value: { stringValue: 'cnc-spindle-04' } },
      { key: 'industrial.protocol', value: { stringValue: 'mtconnect' } },
      
      // Action & Anomaly feedback
      { key: 'physical.action.status', value: { stringValue: execution.status } },
      { key: 'physical.action.duration_ms', value: { doubleValue: execution.durationMs } },
      { key: 'physical.telemetry.deviation', value: { doubleValue: Number(execution.deviation.toFixed(3)) } },
      
      // Operator intervention context
      { key: 'ai.human.intervention', value: { boolValue: false } },
      { key: 'physical.test.session_id', value: { stringValue: mockSession.sessionId } },
      { key: 'physical.test.operator_mode', value: { stringValue: mockSession.operatorMode } }
    ]
  };

  // Inject anomaly info if detected
  if (execution.anomalyDetected) {
    span.attributes.push(
      { key: 'physical.anomaly.type', value: { stringValue: execution.anomalyType } },
      { key: 'physical.anomaly.severity', value: { stringValue: 'warning' } }
    );
  }

  return span;
}

// 3. Execution
const payload = generateSpanPayload();
console.log('\nGenerated compliant AGE trace span payload:');
console.log(JSON.stringify(payload, null, 2));
