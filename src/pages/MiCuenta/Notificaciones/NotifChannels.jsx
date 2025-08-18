import { useState } from "react";

export default function NotifChannels({ initial }) {
  const [state, setState] = useState(
    initial || {
      email: true,
      push: true,
      sms: false,
    }
  );

  const Toggle = ({ k, label }) => (
    <button
      type="button"
      onClick={() => setState({ ...state, [k]: !state[k] })}
      className="w-full flex items-center justify-between py-2"
    >
      <span className="text-sm">{label}</span>
      <span
        className={`inline-flex h-6 w-11 items-center rounded-full border transition
        ${state[k] ? "bg-blue-600 border-blue-600" : "bg-gray-200 dark:bg-zinc-700 border-transparent"}`}
      >
        <span
          className={`h-5 w-5 bg-white rounded-full shadow transform transition
          ${state[k] ? "translate-x-5" : "translate-x-1"}`}
        />
      </span>
    </button>
  );

  return (
    <div>
      <div className="font-semibold mb-2">Canales</div>
      <div className="divide-y divide-gray-200 dark:divide-zinc-800">
        <Toggle k="email" label="Correo electrónico" />
        <Toggle k="push" label="Notificaciones push" />
        <Toggle k="sms" label="SMS" />
      </div>
    </div>
  );
}
