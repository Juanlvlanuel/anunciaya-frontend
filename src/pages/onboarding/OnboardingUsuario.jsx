export default function OnboardingUsuario() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Bienvenido a AnunciaYA</h1>
      <p className="text-sm text-gray-600">Completa estos pasos para empezar:</p>
      <ol className="list-decimal pl-6 mt-3 space-y-1 text-sm">
        <li>Confirma tu correo</li>
        <li>Completa tu perfil</li>
        <li>Explora negocios y promociones</li>
      </ol>
    </div>
  );
}
