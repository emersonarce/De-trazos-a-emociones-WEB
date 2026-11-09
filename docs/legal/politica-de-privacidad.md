# Política de Privacidad

> Versión 1 · octubre de 2026. Elaborado en el marco de un trabajo de grado académico, bajo supervisión del asesor.
> Sujeto a revisión del asesor. El texto visible en la app está en `frontend/src/pages/Privacidad.jsx`.

## 1. Responsable del tratamiento

Los responsables son los autores (Emerson Becerra Arce, Jorge Luis Eliss Quintana y Jesús Daniel Martínez Anaya) como personas naturales, en el marco de su trabajo de grado en la UNAC, con supervisión del asesor Néstor Vélez Vargas. MongoDB, Inc. (Atlas) es encargado del almacenamiento. Contacto: emerson.becerraa@unac.edu.co

## 2. Marco legal

Ley 1581 de 2012; Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015); Constitución arts. 15 y 44; Ley 1098 de 2006 art. 8.

## 3. Qué datos se recogen y para qué

- Cuenta: nombre, apellido, correo, rol, contraseña (hash) — crear cuenta, autenticar, adaptar al rol.
- Datos básicos del niño: nombre o alias (opcional), edad, género.
- Contexto del niño: situación actual, comportamiento reciente, diagnóstico previo (opcional).
- Contexto del dibujo: espontáneo o solicitado, comentarios, duración.
- Dibujo: fotografía reducida a 800 px.
- Resultado: rasgos, interpretación, emoción, intensidad, lectura orientativa, fecha.
- Técnicos: tiempos y errores del análisis; sesión en el navegador.

## 4. Datos sensibles

El "diagnóstico previo" es dato de salud (sensible, arts. 5 y 6): opcional, no obligatorio, con autorización explícita. Las lecturas emocionales se tratan con protección reforzada.

## 5. Datos de menores

Niños de 4 a 12 años. Art. 7 Ley 1581 y art. 12 Decreto 1377: interés superior y consentimiento del representante legal. Los niños no tienen cuenta. La autorización del representante legal forma parte de los datos que deben existir para el tratamiento, pero la aplicación no la solicita, no la almacena ni la verifica: su obtención y verificación corresponden a la institución o entidad profesional que utiliza la herramienta.

## 6. Uso en la investigación

Solo los datos de la prueba piloto (tercer grado, Colegio Icolven) se usan para investigación, reportados de forma agregada; no se publican dibujos ni resultados individuales. Una muestra codificada puede revisarla un profesional en psicología. El uso normal de la app no se usa para investigación.

## 7. Dónde se almacenan

- MongoDB Atlas (nube): cuenta, contexto y resultados. Puede estar fuera de Colombia (transferencia internacional, art. 26).
- Servidor del proyecto: imágenes de los dibujos.
- Análisis local: MiniCPM-V vía Ollama, en el mismo servidor; sin envío a IA externa.
- Navegador: token de sesión y datos básicos.
- Equipo del proyecto: material de la prueba piloto.

## 8. Con quién se comparte

No se vende ni cede. Acceden: encargados técnicos (MongoDB, y a futuro el proveedor de correo); otros usuarios con acceso compartido; en investigación, el colegio (informe agregado) y el psicólogo revisor (muestra codificada); autoridades cuando la ley lo exija.

## 9. Conservación

- Cuenta: mientras esté activa; se borra a solicitud.
- Niño, dibujos y análisis: hasta borrado, revocación o 12 meses sin actividad.
- Prueba piloto: hasta la aprobación del trabajo de grado.
- Técnicos: ~6 meses. Las copias de respaldo pueden retener lo borrado hasta vencer.

## 10. Derechos (habeas data)

Art. 8 Ley 1581: conocer, actualizar, rectificar, suprimir y revocar. Ejercer a emerson.becerraa@unac.edu.co. Consultas: 10 días hábiles; reclamos: 15 días hábiles (arts. 14 y 15).

## 11. Seguridad

Medidas razonables; proyecto en desarrollo. No suministrar información más sensible de la necesaria.

## Pendientes antes de publicar (notas para el equipo)

- Confirmar responsable y correo oficial con el asesor.
- Proteger el acceso a las imágenes (hoy `/uploads` es público).
- Revisar la región del clúster de Atlas (transferencia internacional).
- Decidir si se elimina el campo "diagnóstico previo".
