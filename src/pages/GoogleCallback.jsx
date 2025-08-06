// src/pages/GoogleCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Este archivo será invocado automáticamente después del login de Google (con redirect)
    // Aquí puedes mostrar un mensaje, loader, o hacer alguna validación extra si gustas
    // Al terminar, redirige al home o dashboard según tu lógica
    Swal.fire({
      icon: "success",
      title: "Redirigiendo...",
      text: "¡Login con Google exitoso!",
      timer: 1500,
      showConfirmButton: false
    });
    // Espera un segundo y redirige
    setTimeout(() => {
      navigate("/");
    }, 1200);
  }, [navigate]);

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: 22
    }}>
      Procesando autenticación con Google...
    </div>
  );
};

export default GoogleCallback;
