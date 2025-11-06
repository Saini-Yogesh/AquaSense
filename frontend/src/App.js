import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LeakDetailsPage from "./component/LeakDetailsPage";
import InfiniteTable from "./component/InfiniteTable";
import TrainDashboard from "./component/TrainDashboard";
import Home from "./component/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/data" element={<InfiniteTable />} />
        <Route path="/data/:runId" element={<LeakDetailsPage />} />
        <Route path="/train" element={<TrainDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
