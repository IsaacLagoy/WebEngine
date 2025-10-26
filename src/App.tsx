import React from "react";
import WebGLCanvas from "./components/WebGLCanvas";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
      }}
    >
      <WebGLCanvas />
    </div>
  );
}

export default App;
