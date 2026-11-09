import { Check, X } from 'lucide-react';
import { REGLAS_PASSWORD } from '../../utils/password';
import './PasswordChecklist.css';

// Muestra en vivo qué requisitos cumple la contraseña.
const PasswordChecklist = ({ password = '' }) => {
  if (!password) return null;
  return (
    <ul className="pw-checklist">
      {REGLAS_PASSWORD.map((r, i) => {
        const ok = r.test(password);
        return (
          <li key={i} className={ok ? 'ok' : 'pend'}>
            {ok ? <Check size={14} /> : <X size={14} />}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordChecklist;
