import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LeakDetailsPage from "./LeakDetailsPage";
import InfiniteTable from "./InfiniteTable";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InfiniteTable />} />
        <Route path="/:runId" element={<LeakDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
