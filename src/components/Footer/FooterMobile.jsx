import React from "react";

const FooterMobile = () => {
  return (
    <footer className="bg-white p-4 text-center text-gray-700 text-sm shadow-inner">
      <div className="mb-2">
        <p className="font-semibold">AnunciaYA</p>
        <p className="mt-1 text-xs max-w-xs mx-auto">
          La plataforma más completa para crecer localmente. Únete y conecta con tu comunidad.
        </p>
      </div>
      <div className="flex justify-center gap-6 mb-2">
        <img
          src="/assets/icons/facebook.svg"
          alt="Facebook"
          className="w-5 h-5"
        />
        <img
          src="/assets/icons/instagram.svg"
          alt="Instagram"
          className="w-5 h-5"
        />
        <img
          src="/assets/icons/twitter.svg"
          alt="Twitter"
          className="w-5 h-5"
        />
      </div>
      <p className="text-xs">
        © 2025 AnunciaYA - Todos los derechos reservados.
      </p>
    </footer>
  );
};

export default FooterMobile;
