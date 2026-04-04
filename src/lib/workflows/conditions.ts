export interface Condition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in" | "exists";
  value: unknown;
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  rules: Array<Condition | ConditionGroup>;
}

export interface CallContext {
  id: string;
  status: string;
  answered_by: string | null;
  duration_seconds: number | null;
  analysis: Record<string, unknown> | null;
  transcript: string | null;
  phone: string;
  metadata: Record<string, unknown>;
  contact: {
    id: string;
    name: string | null;
    status: string;
    metadata: Record<string, unknown>;
  } | null;
  campaign_id: string | null;
}

function isConditionGroup(rule: Condition | ConditionGroup): rule is ConditionGroup {
  return "rules" in rule && Array.isArray(rule.rules);
}

export function extractField(context: CallContext, fieldPath: string): unknown {
  const parts = fieldPath.split(".");
  let current: unknown = context;

  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function toNumber(val: unknown): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return null;
}

export function evaluateCondition(condition: Condition, context: CallContext): boolean {
  const fieldValue = extractField(context, condition.field);

  switch (condition.operator) {
    case "exists":
      return fieldValue != null;

    case "eq":
      // eslint-disable-next-line eqeqeq
      return fieldValue == condition.value;

    case "neq":
      // eslint-disable-next-line eqeqeq
      return fieldValue != condition.value;

    case "gt": {
      const a = toNumber(fieldValue);
      const b = toNumber(condition.value);
      return a !== null && b !== null && a > b;
    }
    case "lt": {
      const a = toNumber(fieldValue);
      const b = toNumber(condition.value);
      return a !== null && b !== null && a < b;
    }
    case "gte": {
      const a = toNumber(fieldValue);
      const b = toNumber(condition.value);
      return a !== null && b !== null && a >= b;
    }
    case "lte": {
      const a = toNumber(fieldValue);
      const b = toNumber(condition.value);
      return a !== null && b !== null && a <= b;
    }

    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof condition.value === "string" &&
        fieldValue.toLowerCase().includes(condition.value.toLowerCase())
      );

    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);

    default:
      return false;
  }
}

export function evaluateConditionGroup(group: ConditionGroup, context: CallContext): boolean {
  if (!group.rules || group.rules.length === 0) return true;

  if (group.operator === "AND") {
    return group.rules.every((rule) =>
      isConditionGroup(rule)
        ? evaluateConditionGroup(rule, context)
        : evaluateCondition(rule, context)
    );
  }

  return group.rules.some((rule) =>
    isConditionGroup(rule)
      ? evaluateConditionGroup(rule, context)
      : evaluateCondition(rule, context)
  );
}

export function resolveTemplate(template: string, context: CallContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, fieldPath: string) => {
    const value = extractField(context, fieldPath.trim());
    return value != null ? String(value) : "";
  });
}
