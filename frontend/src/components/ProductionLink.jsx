function ProductionLink() {

  return (

    <div className="production-link">

      <h2>Production Deployment</h2>

      <div className="url-box">
        http://localhost:3001
      </div>

      <div className="button-group">

        <button>
          Open Deployment
        </button>

        <button>
          Copy URL
        </button>

      </div>

    </div>
  );
}

export default ProductionLink;