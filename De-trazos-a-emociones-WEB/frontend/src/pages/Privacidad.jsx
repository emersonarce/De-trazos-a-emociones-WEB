import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Legal.css';

const Privacidad = () => (
  <div className="legal-wrapper">
    <div className="legal-container">
      <Link to="/register" className="legal-back"><ArrowLeft size={16} /> Volver al registro</Link>
      <h1 className="legal-title">Política de Privacidad</h1>
      <div className="legal-date">Última actualización: octubre de 2026 · Versión 1</div>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        Los responsables del tratamiento son los autores del proyecto "De trazos a emociones" —Emerson Becerra Arce,
        Jorge Luis Eliss Quintana y Jesús Daniel Martínez Anaya— como personas naturales, en el marco de su trabajo de
        grado en la Corporación Universitaria Adventista (UNAC), con supervisión del asesor Néstor Vélez Vargas.
        MongoDB, Inc. (servicio Atlas) actúa como encargado del almacenamiento por cuenta de los responsables. Contacto
        para asuntos de datos: <a href="mailto:emerson.becerraa@unac.edu.co">emerson.becerraa@unac.edu.co</a>.
      </p>

      <h2>2. Marco legal</h2>
      <p>
        Esta política se rige por la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto
        1074 de 2015), así como por la Constitución Política (arts. 15 y 44) y la Ley 1098 de 2006 (art. 8, interés
        superior del niño).
      </p>

      <h2>3. Qué datos se recogen y para qué</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre, apellido, correo, rol y contraseña (guardada con hash, nunca en texto plano) — para crear la cuenta, autenticar y adaptar la experiencia al rol.</li>
        <li><strong>Datos básicos del niño:</strong> nombre o alias (opcional), edad y género — para ajustar la lectura a la etapa de desarrollo.</li>
        <li><strong>Contexto del niño:</strong> situación actual, comportamiento reciente y diagnóstico previo (opcional) — para integrar el contexto en la interpretación.</li>
        <li><strong>Contexto del dibujo:</strong> si fue espontáneo o solicitado, qué comentó el niño y cuánto tardó.</li>
        <li><strong>Dibujo:</strong> la fotografía del dibujo (reducida a 800 px) — para el análisis y el historial.</li>
        <li><strong>Resultado:</strong> rasgos observados, interpretación, emoción, intensidad, lectura orientativa y fecha.</li>
        <li><strong>Técnicos:</strong> tiempos y errores del análisis, y datos de sesión guardados en el navegador — para el funcionamiento y la validación.</li>
      </ul>

      <h2>4. Datos sensibles</h2>
      <p>
        El "diagnóstico previo" es un dato de salud y, por tanto, sensible (Ley 1581, arts. 5 y 6): es
        <strong> totalmente opcional</strong>, nadie está obligado a suministrarlo y solo se trata con autorización
        explícita. Las lecturas emocionales sobre un niño se tratan con el mismo nivel de protección reforzada.
      </p>

      <h2>5. Datos de menores de edad</h2>
      <p>
        La aplicación trata datos e imágenes de niños de 4 a 12 años. Conforme al art. 7 de la Ley 1581 y al art. 12
        del Decreto 1377, su tratamiento atiende el interés superior del menor y requiere el consentimiento de su
        representante legal, que el usuario declara haber obtenido. Los niños no tienen cuenta ni usan la aplicación.
        La autorización del representante legal forma parte de los datos que deben existir para el tratamiento, pero la
        aplicación <strong>no la solicita, no la almacena ni la verifica</strong>: su obtención y verificación
        corresponden a la <strong>institución o entidad profesional</strong> que utiliza la herramienta.
      </p>

      <h2>6. Uso en la investigación</h2>
      <p>
        Solo los datos de la <strong>prueba piloto</strong> (realizada con un grupo de tercer grado del Colegio
        Icolven) se usan con fines de investigación, y se reportan <strong>de forma agregada</strong> en el trabajo de
        grado: no se publican dibujos ni resultados individuales. Una muestra codificada (sin nombres) puede ser
        revisada por un profesional en psicología. <strong>El uso normal de la aplicación no se utiliza con fines de
        investigación.</strong>
      </p>

      <h2>7. Dónde se almacenan</h2>
      <ul>
        <li><strong>MongoDB Atlas</strong> (nube): cuenta, contexto y resultados. El clúster puede operar en servidores fuera de Colombia; en ese caso aplican las reglas de transferencia internacional de datos (Ley 1581, art. 26).</li>
        <li><strong>Servidor del proyecto:</strong> las imágenes de los dibujos se guardan en el servidor donde corre la aplicación.</li>
        <li><strong>Análisis local:</strong> el modelo de IA (MiniCPM-V, vía Ollama) corre en el mismo servidor; las imágenes no se envían a servicios externos de IA.</li>
        <li><strong>Tu navegador:</strong> el token de sesión y datos básicos de la cuenta.</li>
        <li><strong>Equipo del proyecto:</strong> material de la prueba piloto (fotos, planillas, grabaciones de usabilidad).</li>
      </ul>

      <h2>8. Con quién se comparte</h2>
      <p>
        No se venden ni se ceden datos. Pueden acceder: los encargados técnicos (MongoDB y, en el futuro, el proveedor
        de correo); otros usuarios registrados con quienes el responsable de un niño decida compartir su información;
        en la investigación, el colegio (solo un informe agregado) y el psicólogo revisor (muestra codificada); y las
        autoridades cuando la ley lo exija.
      </p>

      <h2>9. Conservación y eliminación</h2>
      <ul>
        <li><strong>Cuenta:</strong> mientras esté activa; se elimina a solicitud del usuario.</li>
        <li><strong>Niño, dibujos y análisis:</strong> hasta que el responsable los borre, se revoque la autorización o pasen 12 meses sin actividad.</li>
        <li><strong>Datos de la prueba piloto:</strong> hasta la aprobación del trabajo de grado.</li>
        <li><strong>Registros técnicos:</strong> alrededor de 6 meses.</li>
      </ul>
      <p>Si el servicio de nube mantiene copias de respaldo, lo borrado puede permanecer en ellas hasta que venzan.</p>

      <h2>10. Tus derechos (habeas data)</h2>
      <p>
        Conforme al art. 8 de la Ley 1581, tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, y a
        revocar la autorización para su tratamiento. Para ejercerlos, escribe a
        <a href="mailto:emerson.becerraa@unac.edu.co"> emerson.becerraa@unac.edu.co</a>. Atenderemos las consultas en un
        máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles (Ley 1581, arts. 14 y 15).
      </p>

      <h2>11. Seguridad</h2>
      <p>
        Se aplican medidas razonables para proteger la información. Al tratarse de un proyecto académico en desarrollo,
        se recomienda no suministrar información más sensible de la necesaria.
      </p>

      <div className="legal-meta">
        Documento elaborado en el marco de un trabajo de grado académico, bajo supervisión del asesor. Sujeto a
        revisión del asesor académico antes de un uso ampliado.
      </div>
    </div>
  </div>
);

export default Privacidad;
