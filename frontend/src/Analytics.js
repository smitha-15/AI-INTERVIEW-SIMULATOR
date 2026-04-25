import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function Analytics() {
  const [dataPoints, setDataPoints] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://127.0.0.1:8000/history?token=" + token)
      .then(res => res.json())
      .then(data => setDataPoints(data));
  }, []);

  const chartData = {
    labels: dataPoints.map((_, i) => `Q${i + 1}`),
    datasets: [
      {
        label: "Scores",
        data: dataPoints.map(d => d.score)
      }
    ]
  };

  return (
    <div>
      <h2>Performance Analytics</h2>
      <Bar data={chartData} />
    </div>
  );
}