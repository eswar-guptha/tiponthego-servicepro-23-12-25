import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";



function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Default redirect */}
        <Route index element={<Navigate to="tips-history" replace />} />

        {/* <Route path="tips-history" element={<TipsHistoryScreen />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
