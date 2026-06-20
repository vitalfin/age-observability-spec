# AGE Observability Specification

The AGE Observability Specification has been restructured into modular files to facilitate adoption, maintenance, and reference.

Please refer to the following documents for details:

* **[Overview & Core Namespace Hierarchy](specification/README.md)**: Understanding the namespaces and correlation between AGE decisions, physical simulation inputs, and mechanical outcomes.
* **Semantic Conventions by Namespace**:
  * [AGE Decision & Simulation Namespace (`ai.decision.*`, `ai.simulation.*`, `ai.agent.*`)](specification/conventions/ai-decision.md)
  * [AGE Intent Namespace (`ai.intent.*`)](specification/conventions/ai-intent.md)
  * [Physical Control & Protocols Namespace (`ai.physical.*`, `physical.sensor.*`, `industrial.*`)](specification/conventions/physical-control.md)
  * [Physical Action & Anomaly Namespace (`physical.action.*`, `physical.anomaly.*`)](specification/conventions/physical-action.md)
  * [Human Interaction Namespace (`ai.human.*`, `external.interaction.*`)](specification/conventions/human-interaction.md)
  * [Dynamic Industry Extensions](specification/conventions/dynamic-extensions.md)
* **[Conformance & Verification](specification/conformance.md)**: How to validate your implementations against JSON and Protobuf schemas using the conformance test suite.
