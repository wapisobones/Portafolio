(() => {
  "use strict";

  const validate = (data) => {
    const assert = (condition, message) => {
      if (!condition) throw new Error(message);
    };
    assert(data?.meta?.fictional === true, "El conjunto debe identificarse como ficticio.");
    const collections = ["clients", "locations", "lots", "rules", "measurements", "alerts"];
    collections.forEach((key) => {
      assert(Array.isArray(data[key]), `Colección no válida: ${key}`);
      const ids = data[key].map((item) => item?.id);
      assert(ids.every((id) => typeof id === "string" && id.length > 0), `Identificadores no válidos: ${key}`);
      assert(new Set(ids).size === ids.length, `Identificadores repetidos: ${key}`);
    });

    const has = (key, id) => data[key].some((item) => item.id === id);
    data.clients.forEach((client) => assert(typeof client.name === "string", "Cliente sin nombre."));
    data.locations.forEach((location) => assert(typeof location.label === "string", "Ubicación sin etiqueta."));
    data.lots.forEach((lot) => {
      assert(typeof lot.label === "string", "Lote sin etiqueta.");
      assert(has("clients", lot.clientId) && has("locations", lot.locationId), "Lote con referencias no válidas.");
    });
    data.rules.forEach((rule) => assert(has("clients", rule.clientId), "Regla sin cliente válido."));
    data.measurements.forEach((measurement) => {
      assert(has("lots", measurement.lotId), "Medición sin lote válido.");
      assert(Number.isFinite(measurement.humidityPercent) && measurement.humidityPercent >= 0 && measurement.humidityPercent <= 100, "Humedad no válida.");
    });
    data.alerts.forEach((alert) => {
      const lot = data.lots.find((item) => item.id === alert.lotId);
      const rule = data.rules.find((item) => item.id === alert.ruleId);
      const measurement = data.measurements.find((item) => item.id === alert.measurementId);
      assert(lot && rule && measurement && rule.clientId === lot.clientId && measurement.lotId === lot.id, "Alerta con referencias no válidas.");
    });
    return data;
  };

  let original = null;
  let current = null;
  const clone = (value) => JSON.parse(JSON.stringify(value));

  // Únicamente se interpreta la condición ilustrativa explícita del JSON.
  const ruleSupport = (rule) => {
    if (rule?.illustrative !== true || rule.operator !== ">" ||
        !Number.isFinite(rule.threshold) || rule.threshold < 0) {
      return { evaluates: false, reason: "Condición incompleta o no compatible. No se evalúa." };
    }
    if (rule.metric === "humidityPercent" && rule.unit === "%" && rule.threshold <= 100) {
      return { evaluates: true, reason: "Se compara la nueva humedad con este umbral al registrar." };
    }
    if (rule.metric === "measurementAgeHours" && rule.unit === "h") {
      return { evaluates: false, reason: "Referencia de antigüedad. No se evalúa: no hay reloj de simulación ni barrido temporal definidos." };
    }
    return { evaluates: false, reason: "Métrica o unidad no compatible. No se asume una evaluación." };
  };

  const nextId = (prefix, items) => {
    let sequence = 1;
    const ids = new Set(items.map((item) => item.id));
    while (ids.has(`${prefix}${String(sequence).padStart(3, "0")}`)) sequence++;
    return `${prefix}${String(sequence).padStart(3, "0")}`;
  };

  const recordHumidity = (lotId, value, recordedAt = new Date().toISOString()) => {
    if (!current) throw new Error("Carga los datos ficticios antes de registrar.");
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error("Introduce una humedad entre 0 y 100 %.");
    }
    const lot = current.lots.find((item) => item.id === lotId);
    if (!lot) throw new Error("El lote no está disponible en el conjunto local.");
    const parsed = Date.parse(recordedAt);
    if (!Number.isFinite(parsed)) throw new Error("La fecha de la simulación no es válida.");
    const latest = current.measurements.filter((item) => item.lotId === lotId)
      .reduce((max, item) => Math.max(max, Number.isFinite(Date.parse(item.recordedAt)) ? Date.parse(item.recordedAt) : -Infinity), -Infinity);
    if (parsed <= latest) {
      throw new Error("La hora del navegador debe ser posterior a la última medición del lote. Revisa el reloj o espera antes de reintentar.");
    }
    const measurement = {
      id: nextId("SIM-MED-", current.measurements), lotId,
      recordedAt: new Date(parsed).toISOString(), humidityPercent: value, simulated: true
    };
    const rules = current.rules.filter((rule) => rule.clientId === lot.clientId);
    const supported = rules.filter((rule) => ruleSupport(rule).evaluates);
    const alerts = [];
    supported.filter((rule) => value > rule.threshold).forEach((rule) => {
      alerts.push({
        id: nextId("SIM-ALE-", [...current.alerts, ...alerts]), lotId,
        ruleId: rule.id, measurementId: measurement.id,
        createdAt: measurement.recordedAt, status: "Simulada", simulated: true,
        message: `Simulación: humedad ${value} % mayor que el umbral ilustrativo de ${rule.threshold} %.`
      });
    });
    const limitations = rules.filter((rule) => !ruleSupport(rule).evaluates)
      .map((rule) => `${rule.id}: ${ruleSupport(rule).reason}`);
    if (!supported.length) limitations.unshift("No hay una regla de humedad compatible para este cliente; la medición se registra sin esa evaluación.");
    current.measurements.push(measurement);
    current.alerts.push(...alerts);
    return { measurement, alerts, evaluatedRules: supported.length, limitations };
  };

  const reset = () => {
    if (!original) throw new Error("No hay datos originales cargados para restablecer.");
    current = clone(original);
    return current;
  };

  const load = async () => {
    const response = await fetch("data/demo.json");
    if (!response.ok) throw new Error(`No se pudo cargar demo.json: HTTP ${response.status}`);
    const parsed = validate(await response.json());
    original = clone(parsed);
    current = parsed;
    return current;
  };

  window.CanchaData = { load, recordHumidity, reset, ruleSupport };
})();
