// src/components/CarrouselSecciones
import useMediaQuery from "../../hooks/useMediaQuery";
import CarrouselSeccionesMobile from "./CarrouselSeccionesMobile";
import CarrouselSeccionesDesktop from "./CarrouselSeccionesDesktop";

const CarrouselSecciones = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? (
    <CarrouselSeccionesMobile {...props} />
  ) : (
    <CarrouselSeccionesDesktop {...props} />
  );
};

export default CarrouselSecciones;

