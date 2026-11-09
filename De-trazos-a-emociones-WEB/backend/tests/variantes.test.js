const test = require("node:test");
const assert = require("node:assert/strict");
const { resolverConfigIA, modoIA } = require("../services/ia/variantes");
const { construirPeticionOllama, mensajeErrorOllama } = require("../services/ia/proveedores/ollama");
const { ESQUEMA_ANALISIS } = require("../services/ia/esquema");
const { promptCompleto, promptLibre } = require("../services/ia/prompt");

test("por defecto se usa la variante estructurada, igual que antes", () => {
    const cfg = resolverConfigIA({});
    assert.equal(cfg.variante, "estructurado");
    const p = construirPeticionOllama(cfg, "IMG", "");
    assert.deepEqual(p, {
        model: "minicpm-v",
        format: ESQUEMA_ANALISIS,
        messages: [
            { role: "system", content: promptCompleto("") },
            { role: "user", content: "Analiza esta imagen", images: ["IMG"] }
        ],
        stream: false,
        options: { num_predict: 4000, num_ctx: 8192, temperature: 0.3, repeat_penalty: 1.2, repeat_last_n: 256 },
        keep_alive: "10m"
    });
});

test("el .env ajusta modelo, longitud y contexto", () => {
    const cfg = resolverConfigIA({ OLLAMA_MODEL: "otro", OLLAMA_NUM_PREDICT: "3500", OLLAMA_NUM_CTX: "4096" });
    const p = construirPeticionOllama(cfg, "IMG", "");
    assert.equal(p.model, "otro");
    assert.deepEqual([p.options.num_predict, p.options.num_ctx], [3500, 4096]);
});

test("OLLAMA_FORMAT_MODE=json sigue funcionando en la variante estructurada", () => {
    assert.equal(construirPeticionOllama(resolverConfigIA({ OLLAMA_FORMAT_MODE: "json" }), "I", "").format, "json");
});

test("variante equilibrada: prompt completo junto a la imagen, JSON simple, penalización suave", () => {
    const p = construirPeticionOllama(resolverConfigIA({ IA_VARIANTE: "equilibrado" }), "IMG", "CTX");
    assert.equal(p.format, "json");
    assert.deepEqual(p.messages, [{ role: "user", content: promptCompleto("CTX"), images: ["IMG"] }]);
    assert.equal(p.options.repeat_penalty, 1.05);
});

test("variante libre: prompt breve, sin formato forzado y sin penalización propia", () => {
    const p = construirPeticionOllama(resolverConfigIA({ IA_VARIANTE: "Libre" }), "IMG", "CTX");
    assert.equal(p.format, undefined);
    assert.deepEqual(p.messages, [{ role: "user", content: promptLibre("CTX"), images: ["IMG"] }]);
    assert.equal("repeat_penalty" in p.options, false);
    assert.match(promptLibre("CTX"), /CTX/);
});

test("OLLAMA_REPEAT_PENALTY reemplaza la penalización de la variante", () => {
    assert.equal(construirPeticionOllama(resolverConfigIA({ OLLAMA_REPEAT_PENALTY: "1.1" }), "I", "").options.repeat_penalty, 1.1);
    assert.equal(construirPeticionOllama(resolverConfigIA({ OLLAMA_REPEAT_PENALTY: "abc" }), "I", "").options.repeat_penalty, 1.2);
});

test("una variante desconocida cae en la estructurada", () => {
    assert.equal(resolverConfigIA({ IA_VARIANTE: "inventada" }).variante, "estructurado");
    assert.equal(resolverConfigIA({}, "libre").variante, "libre");
});

test("AI_MODE por defecto es ollama", () => {
    assert.equal(modoIA({}), "ollama");
    assert.equal(modoIA({ AI_MODE: "MOCK" }), "mock");
});

test("los errores de Ollama se traducen a mensajes claros", () => {
    const cfg = { modelo: "minicpm-v" };
    assert.match(mensajeErrorOllama({ code: "ECONNREFUSED", message: "x" }, cfg), /No se pudo conectar con el motor de IA/);
    assert.match(mensajeErrorOllama({ response: { data: { error: 'model "minicpm-v" not found' } } }, cfg), /ollama pull minicpm-v/);
    assert.match(mensajeErrorOllama({ response: { data: { error: "out of memory" } } }, cfg), /respondió con un error: out of memory/);
    assert.equal(mensajeErrorOllama({ message: "otro" }, cfg), "otro");
});
