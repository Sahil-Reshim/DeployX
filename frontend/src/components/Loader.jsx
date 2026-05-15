function Loader() {

  return (

    <div className="loader-container">

      <div className="loader-ring">

        <div className="loader-ring-outer"></div>

        <div className="loader-ring-inner"></div>

      </div>

      <p className="loader-text">
        Deploying application...
      </p>

    </div>

  );
}

export default Loader;