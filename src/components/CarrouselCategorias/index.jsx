import useMediaQuery from "../../hooks/useMediaQuery";
import CarrouselCategoriasMobile from "./CarrouselCategoriasMobile";
import CarrouselCategoriasDesktop from "./CarrouselCategoriasDesktop";

const CarrouselCategorias = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? (
    <CarrouselCategoriasMobile {...props} />
  ) : (
    <CarrouselCategoriasDesktop {...props} />
  );
};

export default CarrouselCategorias;
