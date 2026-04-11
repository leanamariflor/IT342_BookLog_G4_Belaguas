import React from "react";
import "../css/PageLoader.css";

const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="page-loader-shell" aria-live="polite" aria-busy="true">
      <div className="page-loader-card">
        <div className="page-loader-book" aria-hidden="true">
          <div className="page-loader-book-half left" />
          <div className="page-loader-book-half right" />
          <div className="page-loader-book-page" />
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
