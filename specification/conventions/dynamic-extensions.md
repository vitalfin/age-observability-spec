# Dynamic Industry Extensions

To support domain-specific needs (e.g., aerospace flight phases, robotic torques, healthcare compliance parameters, and manufacturing tool statistics) without bloating the main database schema, the specification supports **Dynamic Industry Extensions**.

## Convention Rules (RFC 2119)

1. Any trace attribute starting with one of the following prefixes **MAY** be captured dynamically:
   - `aerospace.*`
   - `robotics.*`
   - `healthcare.*`
   - `manufacturing.*`
2. Custom attributes that do not match a core database column **SHOULD** be prefix-namespaced under their respective industry domain to prevent naming collisions.
3. Observers and collectors **MUST** process these dynamically matching attributes by serializing them as a JSON object, storing them inside a single `industry_extensions` field.
4. Visualization tools and dashboards **SHOULD** support dynamic expansion of these custom properties for interactive querying.
