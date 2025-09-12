// src/utils/alerts.js
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// === Config base: estilo premium, compacto ===
const baseConfig = {
  background: "#fff",
  color: "#1f2937", // gris-900
  showConfirmButton: true,
  confirmButtonText: "OK",
  buttonsStyling: false,
  customClass: {
    popup: "rounded-xl shadow-lg p-5 w-[320px]", // compacto
    title: "text-lg font-semibold text-gray-800",
    htmlContainer: "text-sm text-gray-600",
    confirmButton:
      "mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none",
  },
};

// === Variantes de iconos ===
export const showError = (title, text) =>
  Swal.fire({
    ...baseConfig,
    icon: "error",
    iconColor: "#dc2626",
    title,
    text,
    confirmButtonColor: "#dc2626",
  });

export const showSuccess = (title, text) =>
  Swal.fire({
    ...baseConfig,
    icon: "success",
    iconColor: "#16a34a",
    title,
    text,
    confirmButtonColor: "#16a34a",
  });

export const showInfo = (title, text) =>
  Swal.fire({
    ...baseConfig,
    icon: "info",
    iconColor: "#2563eb",
    title,
    text,
    confirmButtonColor: "#2563eb",
  });

export const showWarning = (title, text) =>
  Swal.fire({
    ...baseConfig,
    icon: "warning",
    iconColor: "#f59e0b",
    title,
    text,
    confirmButtonColor: "#f59e0b",
  });

// === Confirmación con botones premium ===
export const showConfirm = (title, text, onConfirm) =>
  Swal.fire({
    ...baseConfig,
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    customClass: {
      ...baseConfig.customClass,
      confirmButton:
        "mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700",
      cancelButton:
        "mt-3 ml-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300",
    },
  }).then((res) => {
    if (res.isConfirmed && typeof onConfirm === "function") {
      onConfirm();
    }
  });

// === Toast compacto (top-right) ===
export const showToast = (type, text) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: type, // "success" | "error" | "warning" | "info"
    title: text,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: "#fff",
    color: "#1f2937",
    customClass: {
      popup: "rounded-lg shadow-md p-3 text-sm",
      title: "text-sm font-medium text-gray-700",
    },
  });
