// Mini-validador JSON Schema (subset do draft 2020-12) para os testes do kit.
// Suporta o subconjunto usado pelos schemas do kit: $defs/$ref local, allOf,
// type, enum, const, required, properties, additionalProperties, items,
// minItems, minLength, minimum, maximum, pattern.
export const validate = (schema, instance) => {
  const errors = [];

  const resolveRef = (ref) => {
    if (!ref.startsWith("#/")) return null;
    const parts = ref.slice(2).split("/").map((part) => decodeURIComponent(part));
    let node = schema;
    for (const part of parts) {
      if (node === null || typeof node !== "object") return null;
      node = node[part];
    }
    return node;
  };

  const walk = (sch, inst, instancePath) => {
    if (sch.$ref) {
      const target = resolveRef(sch.$ref);
      if (!target) {
        errors.push(`${instancePath}: $ref irresolvível ${sch.$ref}`);
        return;
      }
      walk(target, inst, instancePath);
      return;
    }
    if (sch.allOf) {
      for (const sub of sch.allOf) walk(sub, inst, instancePath);
      return;
    }
    if (sch.type) {
      const typeOk =
        sch.type === "object"
          ? inst !== null && typeof inst === "object" && !Array.isArray(inst)
          : sch.type === "array"
            ? Array.isArray(inst)
            : sch.type === "string"
              ? typeof inst === "string"
              : sch.type === "number"
                ? typeof inst === "number"
                : sch.type === "integer"
                  ? Number.isInteger(inst)
                  : sch.type === "boolean"
                    ? typeof inst === "boolean"
                    : true;
      if (!typeOk) {
        errors.push(`${instancePath}: esperado tipo ${sch.type}`);
        return;
      }
    }
    if (sch.enum !== undefined && !sch.enum.includes(inst)) {
      errors.push(`${instancePath}: valor fora do enum`);
    }
    if (sch.const !== undefined && inst !== sch.const) {
      errors.push(`${instancePath}: valor difere do const`);
    }
    if (typeof inst === "string") {
      if (sch.minLength !== undefined && inst.length < sch.minLength) {
        errors.push(`${instancePath}: string menor que minLength`);
      }
      if (sch.pattern !== undefined && !new RegExp(sch.pattern).test(inst)) {
        errors.push(`${instancePath}: não casa com o pattern`);
      }
    }
    if (typeof inst === "number") {
      if (sch.minimum !== undefined && inst < sch.minimum) {
        errors.push(`${instancePath}: menor que minimum`);
      }
      if (sch.maximum !== undefined && inst > sch.maximum) {
        errors.push(`${instancePath}: maior que maximum`);
      }
    }
    if (Array.isArray(inst)) {
      if (sch.minItems !== undefined && inst.length < sch.minItems) {
        errors.push(`${instancePath}: menos itens que minItems`);
      }
      if (sch.items) {
        for (let index = 0; index < inst.length; index += 1) {
          walk(sch.items, inst[index], `${instancePath}[${index}]`);
        }
      }
    }
    if (inst !== null && typeof inst === "object" && !Array.isArray(inst)) {
      if (sch.required) {
        for (const key of sch.required) {
          if (!(key in inst)) errors.push(`${instancePath}: falta a propriedade obrigatória "${key}"`);
        }
      }
      if (sch.properties) {
        for (const [key, sub] of Object.entries(sch.properties)) {
          if (key in inst) walk(sub, inst[key], `${instancePath}.${key}`);
        }
      }
      if (sch.additionalProperties === false) {
        for (const key of Object.keys(inst)) {
          if (!sch.properties || !(key in sch.properties)) {
            errors.push(`${instancePath}: propriedade adicional "${key}"`);
          }
        }
      }
    }
  };

  walk(schema, instance, "$");
  return { valid: errors.length === 0, errors };
};
