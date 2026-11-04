const test = require("node:test");
const assert = require("node:assert/strict");
const { permisosEfectivos } = require("../utils/permisos");
const { validarPassword } = require("../utils/password");
const { esEmailAdmin } = require("../utils/admin");

test("permisos: admin todo, cuenta heredada todo, cuenta nueva solo lo habilitado", () => {
    assert.deepEqual(permisosEfectivos(null), { conContexto: false, descargarPdf: false, eliminarCuenta: false, admin: false });
    assert.deepEqual(permisosEfectivos({ esAdmin: true }), { conContexto: true, descargarPdf: true, eliminarCuenta: false, admin: true });
    assert.deepEqual(permisosEfectivos({}), { conContexto: true, descargarPdf: true, eliminarCuenta: false, admin: false });
    assert.deepEqual(permisosEfectivos({ permisos: { conContexto: false, descargarPdf: true } }), { conContexto: false, descargarPdf: true, eliminarCuenta: false, admin: false });
});

test("permiso de eliminar la cuenta: solo si lo asigna el administrador, y nunca para un admin", () => {
    // Cuenta heredada: el resto completo, pero eliminar la cuenta no viene incluido.
    assert.equal(permisosEfectivos({}).eliminarCuenta, false);
    // Heredada con el permiso asignado: lo tiene y conserva el acceso completo.
    assert.deepEqual(permisosEfectivos({ permisos: { eliminarCuenta: true } }), { conContexto: true, descargarPdf: true, eliminarCuenta: true, admin: false });
    assert.equal(permisosEfectivos({ permisos: { conContexto: true, descargarPdf: false, eliminarCuenta: true } }).eliminarCuenta, true);
    assert.equal(permisosEfectivos({ permisos: { conContexto: true, descargarPdf: true, eliminarCuenta: false } }).eliminarCuenta, false);
    assert.equal(permisosEfectivos({ esAdmin: true, permisos: { eliminarCuenta: true } }).eliminarCuenta, false);
});

test("contraseña segura: largo, mayúscula, minúscula, número y símbolo", () => {
    assert.match(validarPassword("Ab1!"), /8 caracteres/);
    assert.match(validarPassword("abcdefg1!"), /mayúscula/);
    assert.match(validarPassword("ABCDEFG1!"), /minúscula/);
    assert.match(validarPassword("Abcdefgh!"), /número/);
    assert.match(validarPassword("Abcdefg1"), /símbolo/);
    assert.equal(validarPassword("Abcdefg1!"), null);
});

test("correos de administrador desde ADMIN_EMAILS, sin importar mayúsculas ni espacios", () => {
    const antes = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = " Admin@Unac.edu.co , otro@x.co";
    assert.equal(esEmailAdmin("admin@unac.edu.co"), true);
    assert.equal(esEmailAdmin(" OTRO@x.co "), true);
    assert.equal(esEmailAdmin("nadie@x.co"), false);
    assert.equal(esEmailAdmin(""), false);
    if (antes === undefined) delete process.env.ADMIN_EMAILS; else process.env.ADMIN_EMAILS = antes;
});
