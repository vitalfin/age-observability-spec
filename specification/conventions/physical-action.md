# Physical Action, Deviation & Anomaly Conventions

These attributes capture the actual mechanical outcome, the deviation between simulated/expected behavior and reality, and details of any anomalies.

## Namespace Attributes

| Attribute | Type | Description | Requirement Level | Examples |
| :--- | :--- | :--- | :--- | :--- |
| `physical.action.status` | `string` | The final status of the command execution. | **Required** | `"completed"`, `"interrupted"`, `"safety_abort"` |
| `physical.action.duration_ms` | `double` | Actual duration of the physical command execution. | **Recommended** | `1250.5` |
| `physical.telemetry.deviation` | `double` | Measured difference between target/simulated state and actual sensor feedback. | **Required** | `12.4` (RPM delta), `0.045` (mm displacement) |
| `physical.anomaly.type` | `string` | Classification of the physical anomaly detected. | **Recommended** | `"thermal_expansion"`, `"joint_backlash"`, `"sensor_drift"` |
| `physical.anomaly.severity` | `string` | Severity level of the anomaly. MUST be one of: `info`, `warning`, `critical`. | **Recommended** | `"warning"`, `"critical"` |
| `physical.anomaly.corrective_action` | `string` | Corrective strategy applied in response to the anomaly. | **Optional** | `"emergency_stop"`, `"model_fallback"` |
| `physical.test.session_id` | `string` | Unique ID of the research/test session run. | **Recommended** | `"session_20260619_01"` |
| `physical.test.operator_mode` | `string` | Human presence context during testing. | **Recommended** | `"autonomous"`, `"human_in_the_loop"`, `"manual_override"` |

## Compliance Rules (RFC 2119)

1. Conforming spans **MUST** report the outcome using the `physical.action.status` attribute.
2. The `physical.telemetry.deviation` attribute **MUST** be included to log physical deviation. It **MUST** be a numeric value representing the raw physical offset (e.g. difference in millimeters, degrees, or RPM).
3. If an anomaly occurs, `physical.anomaly.type` and `physical.anomaly.severity` **SHOULD** be populated.
4. The `physical.anomaly.severity` attribute **MUST** be one of: `"info"`, `"warning"`, or `"critical"` if present.
5. In environments involving simulation comparison, the duration of mechanical execution **SHOULD** be tracked using `physical.action.duration_ms`.
