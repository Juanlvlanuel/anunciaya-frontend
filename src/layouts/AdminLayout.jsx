import { Outlet } from "react-router-dom";

const AdminLayout = () => {
    return (
        <>
            <header className="w-full relative bg-gradient-to-b from-[#0073CF] to-[#112391] py-2 px-8 flex items-center">
                {/* Logotipo a la izquierda */}
                <img
                    src="/LogosAnunciaYA-admin.png"
                    alt="AnunciaYA"
                    className="h-16 filter drop-shadow-[0_2px_6px_white] z-10"
                />

                {/* Texto centrado absoluto */}
                <h1 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl sm:text-4xl font-bold text-center">
                    Panel Administrativo
                </h1>
            </header>



            {/* 🧩 Contenido interno del panel admin */}
            <div className="p-6 min-h-[100vh] bg-gray-100 overflow-auto">
                <Outlet />
            </div>
        </>
    );
};

export default AdminLayout;
