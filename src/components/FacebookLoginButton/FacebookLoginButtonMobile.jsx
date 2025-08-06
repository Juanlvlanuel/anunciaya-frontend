const FacebookLoginButtonMobile = (props) => {
  return (
    <button
      className="
        w-full
        bg-[#3b5998]
        text-white
        rounded-lg
        font-bold
        border-none
        py-4
        my-2
        transition-all
        active:scale-95
        shadow
        text-base
      "
      {...props}
    >
      Facebook Login (Móvil)
    </button>
  );
};

export default FacebookLoginButtonMobile;
