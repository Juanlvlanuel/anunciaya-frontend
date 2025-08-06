const FacebookLoginButtonMobile = (props) => {
  return (
    <button
      style={{
        padding: 16,
        width: "100%",
        background: "#3b5998",
        color: "#fff",
        borderRadius: 8,
        fontWeight: "bold",
        border: "none",
        margin: "8px 0",
      }}
      {...props}
    >
      Facebook Login (Móvil)
    </button>
  );
};

export default FacebookLoginButtonMobile;
