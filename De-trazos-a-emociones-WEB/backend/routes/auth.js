const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { esEmailAdmin } = require("../utils/admin");
const { validarPassword } = require("../utils/password");
const { permisosEfectivos } = require("../utils/permisos");

const router = express.Router();

/*
========================================
REGISTRO
POST /auth/register
========================================
*/

router.post("/register", async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, institucion } = req.body;

        // Validar campos
        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        // Validar política de contraseña segura
        const errorPassword = validarPassword(password);
        if (errorPassword) {
            return res.status(400).json({ message: errorPassword });
        }

        // Normalizar email
        const emailNormalizado = email.toLowerCase().trim();

        // Comprobar si el usuario ya existe
        const usuarioExistente = await User.findOne({
            email: emailNormalizado
        });

        if (usuarioExistente) {
            return res.status(409).json({
                message: usuarioExistente.estado === "eliminado"
                    ? "Ese correo es de una cuenta eliminada. Si quieres recuperarla, pídele al administrador que la restaure."
                    : "El correo ya está registrado"
            });
        }

        // Hashear contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Si el correo está en ADMIN_EMAILS, la cuenta es admin y queda aprobada;
        // de lo contrario queda pendiente de aprobación por el administrador.
        const admin = esEmailAdmin(emailNormalizado);

        // Crear usuario
        const nuevoUsuario = new User({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: emailNormalizado,
            password: passwordHash,
            rol: rol,
            institucion: (institucion || "").trim(),
            esAdmin: admin,
            estado: admin ? "aprobado" : "pendiente",
            // Las cuentas nuevas arrancan restringidas: solo análisis de dibujo
            // suelto. El administrador habilita lo demás por usuario.
            permisos: { conContexto: false, descargarPdf: false }
        });

        await nuevoUsuario.save();

        return res.status(201).json({
            message: admin
                ? "Cuenta de administrador creada. Ya puedes iniciar sesión."
                : "Registro recibido. Tu cuenta quedó pendiente de aprobación por el administrador.",
            estado: nuevoUsuario.estado,
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                estado: nuevoUsuario.estado
            }
        });

    } catch (error) {
        console.error("Error en registro:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
});


/*
========================================
LOGIN
POST /auth/login
========================================
*/

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                message: "El correo y la contraseña son obligatorios"
            });
        }

        // Normalizar email
        const emailNormalizado = email.toLowerCase().trim();

        // Buscar usuario
        const usuario = await User.findOne({
            email: emailNormalizado
        });

        // No revelar si el correo existe
        if (!usuario) {
            return res.status(401).json({
                message: "Credenciales incorrectas"
            });
        }

        // Comparar contraseña
        const passwordValida = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordValida) {
            return res.status(401).json({
                message: "Credenciales incorrectas"
            });
        }

        // Reconciliar administrador desde ADMIN_EMAILS (por si el correo se
        // agregó a la lista después de haberse registrado).
        if (esEmailAdmin(usuario.email) && (!usuario.esAdmin || usuario.estado !== "aprobado")) {
            usuario.esAdmin = true;
            usuario.estado = "aprobado";
            await usuario.save();
        }

        // Bloquear el acceso hasta que el administrador apruebe la cuenta.
        if (usuario.estado === "pendiente") {
            return res.status(403).json({
                message: "Tu cuenta está pendiente de aprobación por el administrador."
            });
        }

        if (usuario.estado === "rechazado") {
            return res.status(403).json({
                message: "Tu solicitud de registro fue rechazada. Comunícate con el administrador."
            });
        }

        if (usuario.estado === "eliminado") {
            return res.status(403).json({
                message: "Esta cuenta fue eliminada. Si fue un error, pídele al administrador que la restaure."
            });
        }

        // Crear JWT
        const token = jwt.sign(
            {
                id: usuario._id,
                email: usuario.email,
                rol: usuario.rol,
                esAdmin: usuario.esAdmin
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "7d"
            }
        );

        return res.status(200).json({
            message: "Login exitoso",
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                esAdmin: usuario.esAdmin,
                permisos: permisosEfectivos(usuario)
            }
        });

    } catch (error) {
        console.error("Error en login:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
});


module.exports = router;