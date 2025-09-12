const FacebookLoginButtonMobile = (props) => {
  return (
    <button
      className="
        w-full
        bg-white
        border border-gray-300
        text-gray-900
        text-sm
        py-2 px-3
        rounded-lg
        hover:bg-gray-100
        transition
        font-medium
        flex items-center justify-center gap-2
        shadow
      "
      {...props}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        <img
          src="/icons/icon-facebook.webp"
          alt="Facebook"
          className="w-5 h-5 object-contain"
        />
      </div>
      Continuar con Facebook
    </button>
  );
};

export default FacebookLoginButtonMobile;
