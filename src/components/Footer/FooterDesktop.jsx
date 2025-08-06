import React from "react";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-gray-500 via-gray-800 to-black text-white px-3 py-3 lg:px-4 lg:py-4 shadow-inner">
      <div className="max-w-[98%] mx-auto w-full">
        {/* PC: Todo centrado en una sola fila */}
        <div className="hidden lg:flex flex-row items-center justify-center gap-6 text-base">
          <span className="font-medium">
            &copy; {new Date().getFullYear()} AnunciaYA. Todos los Derechos Reservados.
          </span>
          <div className="flex gap-4 ml-5">
            <button
              onClick={() => window.open("https://www.facebook.com/juanmanuel.valenzuelajabalera", "_blank")}
              aria-label="Facebook"
            >
              <FaFacebook className="text-white text-2xl hover:text-blue-400 transition" />
            </button>
            <button
              onClick={() => window.open("https://wa.me/526381128286", "_blank")}
              aria-label="Whatsapp"
            >
              <FaWhatsapp className="text-white text-2xl hover:text-green-400 transition" />
            </button>
          </div>
        </div>
        {/* MÓVIL: Íconos arriba, texto abajo, todo centrado */}
        <div className="flex flex-col items-center justify-center text-center gap-0 lg:hidden w-full">
          <div className="flex gap-5 justify-center mb-1">
            <button
              onClick={() => window.open("https://www.facebook.com/juanmanuel.valenzuelajabalera", "_blank")}
              aria-label="Facebook"
            >
              <FaFacebook className="text-white text-2xl hover:text-blue-400 transition" />
            </button>
            <button
              onClick={() => window.open("https://wa.me/526381128286", "_blank")}
              aria-label="Whatsapp"
            >
              <FaWhatsapp className="text-white text-2xl hover:text-green-400 transition" />
            </button>
          </div>
          <span className="text-base font-semibold w-full block">
            &copy; {new Date().getFullYear()} AnunciaYA. Todos los Derechos Reservados.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
