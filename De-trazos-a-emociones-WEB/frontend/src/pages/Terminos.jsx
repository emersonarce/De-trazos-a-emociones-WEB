import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Legal.css';

const Terminos = () => (
  <div className="legal-wrapper">
    <div className="legal-container">
      <Link to="/register" className="legal-back"><ArrowLeft size={16} /> Volver al registro</Link>
      <h1 className="legal-title">Términos y Condiciones</h1>
      <div className="legal-date">Última actualización: octubre de 2026 · Versión 1</div>

      <h2>1. Qué es "De trazos a emociones"</h2>
      <p>
        "De trazos a emociones" es una aplicación web desarrollada como trabajo de grado (asignatura Proyecto de
        Grado II, IDS044) en la Corporación Universitaria Adventista (UNAC), Facultad de Ingeniería, Programa de
        Ingeniería de Sistemas, en Medellín (Antioquia), Colombia. Autores: Emerson Becerra Arce, Jorge Luis Eliss
        Quintana y Jesús Daniel Martínez Anaya. Asesor: Néstor Vélez Vargas.
      </p>
      <p>
        La aplicación analiza un dibujo infantil (un dibujo hecho en papel y digitalizado con una fotografía) junto
        con el contexto del niño, y entrega una <strong>lectura orientativa</strong> de las emociones que el dibujo
        podría estar expresando. <strong>No realiza diagnósticos clínicos, no reemplaza la valoración de un
        profesional y no detecta maltrato.</strong> Es una ayuda para que un adulto acompañe al niño.
      </p>

      <h2>2. Objetivo de la herramienta</h2>
      <p>Objetivo general: construir una herramienta tecnológica que permita identificar y expresar emociones
        infantiles mediante el dibujo digital para apoyar la prevención del maltrato infantil. Objetivos específicos:</p>
      <ul>
        <li>Identificar en la literatura las estrategias y plataformas tecnológicas usadas para el manejo y la expresión de emociones en niños.</li>
        <li>Diseñar la estructura y la interfaz de la aplicación, enfocada en la expresión emocional infantil.</li>
        <li>Desarrollar la herramienta aplicando técnicas básicas de análisis de color y trazo.</li>
        <li>Validar la aplicación mediante una prueba piloto con un grupo de niños y docentes.</li>
      </ul>

      <h2>3. Quién puede usar la aplicación</h2>
      <p>
        La aplicación es para <strong>personas adultas (mayores de 18 años)</strong> en alguno de estos roles: padre,
        madre o tutor; profesor; o psicólogo. Los niños no usan la aplicación ni tienen cuenta: es un adulto quien
        registra datos y dibujos sobre ellos, bajo su responsabilidad.
      </p>

      <h2>4. Registro y cuentas</h2>
      <p>
        El usuario debe proporcionar información veraz y es responsable de la confidencialidad de sus credenciales y
        de la actividad de su cuenta. El registro está <strong>sujeto a verificación del correo y a aprobación</strong>
        de un administrador del proyecto; mientras no sea aprobada, la cuenta no tendrá acceso. Las cuentas pueden ser
        rechazadas o suspendidas si se incumplen estos términos. Cada decisión de aprobación o rechazo queda
        registrada y el administrador mantiene confidencialidad sobre los datos del solicitante.
      </p>

      <h2>5. Responsabilidad sobre los datos de menores</h2>
      <p>
        Quien registre a un niño, su contexto o un dibujo declara que cuenta con el <strong>consentimiento del
        representante legal</strong> del menor y es responsable de haberlo obtenido. El tratamiento de datos de niños,
        niñas y adolescentes atiende su interés superior (Ley 1581 de 2012, art. 7; Decreto 1377 de 2013, art. 12;
        Ley 1098 de 2006, art. 8). El usuario se compromete a usar la información solo con fines de acompañamiento y a
        no divulgarla indebidamente.
      </p>
      <p>
        La aplicación <strong>no solicita, no almacena ni verifica</strong> esa autorización del representante legal.
        Su obtención y su verificación son responsabilidad del usuario y de la <strong>institución o entidad
        profesional</strong> que utiliza la herramienta, no de la aplicación.
      </p>

      <h2>6. Uso aceptable</h2>
      <ul>
        <li>No subir contenido ilícito, ofensivo o que no corresponda a dibujos infantiles.</li>
        <li>No usar la herramienta para tomar decisiones clínicas, legales o educativas sin el criterio de un profesional.</li>
        <li>No intentar vulnerar la seguridad de la aplicación ni acceder a datos de otros usuarios.</li>
      </ul>

      <h2>7. Naturaleza orientativa y limitación de responsabilidad</h2>
      <p>
        Los resultados los genera un modelo de inteligencia artificial y pueden contener errores; son orientativos y
        no constituyen una conclusión sobre el estado emocional o la salud mental de un niño. La aplicación está en
        desarrollo con fines académicos y se ofrece "tal cual", sin garantías sobre la exactitud de los análisis. Los
        autores y la institución no se responsabilizan por decisiones tomadas con base en los resultados.
      </p>

      <h2>8. Datos personales</h2>
      <p>
        El tratamiento de datos se rige por la <Link to="/privacidad">Política de Privacidad</Link>, conforme a la Ley
        1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).
      </p>

      <h2>9. Cambios y contacto</h2>
      <p>
        Estos términos podrán actualizarse; se recomienda revisarlos periódicamente. Para dudas o solicitudes,
        escribe a <a href="mailto:emerson.becerraa@unac.edu.co">emerson.becerraa@unac.edu.co</a>.
      </p>

      <div className="legal-meta">
        Documento elaborado en el marco de un trabajo de grado académico, bajo supervisión del asesor. Sujeto a
        revisión del asesor académico antes de un uso ampliado.
      </div>
    </div>
  </div>
);

export default Terminos;
