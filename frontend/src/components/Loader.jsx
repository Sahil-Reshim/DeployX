function Loader() {
  return (
    <div className="loader-container">
      <div className="loader-ring">
        <div className="loader-ring-outer"></div>
        <div className="loader-ring-inner"></div>
      </div>
      <p className="loader-text">Deploying your infrastructure...</p>
    </div>
  );
}

export default Loader;