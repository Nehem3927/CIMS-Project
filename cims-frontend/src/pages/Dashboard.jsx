import { useEffect, useState } from 'react';
import { getDashboardKPI, getDashboardTrend } from '../services/api';
import { Bar, Line } from 'react-chartjs-2';
import { FiAlertCircle, FiClock, FiActivity, FiLayers } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const [kpi, setKpi] = useState({
    open_incidents: 0,
    avg_resolution_days: 0,
    incidents_by_priority: [],
    incidents_by_category: [],
  });

  const [trend, setTrend] = useState([]);

  useEffect(() => {
    getDashboardKPI().then(res => setKpi(res.data)).catch(console.error);
    getDashboardTrend().then(res => setTrend(res.data)).catch(console.error);
  }, []);

  const priorityChartData = {
    labels: kpi.incidents_by_priority.map(item => item.priority__priority_level || 'Unknown'),
    datasets: [
      {
        label: 'Number of Incidents',
        data: kpi.incidents_by_priority.map(item => item.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.75)', // Critical
          'rgba(245, 158, 11, 0.75)', // High
          'rgba(59, 130, 246, 0.75)',  // Medium
          'rgba(34, 197, 94, 0.75)',  // Low
        ],
        borderRadius: 8,
        barPercentage: 0.55,
      },
    ],
  };

  const categoryChartData = {
    labels: kpi.incidents_by_category.map(item => item.category__category_name || 'General'),
    datasets: [
      {
        label: 'Number of Incidents',
        data: kpi.incidents_by_category.map(item => item.count),
        backgroundColor: [
          'rgba(139, 92, 246, 0.75)', // Purple
          'rgba(236, 72, 153, 0.75)', // Pink
          'rgba(20, 184, 166, 0.75)',  // Teal
          'rgba(59, 130, 246, 0.75)',  // Blue
          'rgba(245, 158, 11, 0.75)',  // Amber
        ],
        borderRadius: 8,
        barPercentage: 0.55,
      },
    ],
  };

  const trendChartData = {
    labels: trend.map(item => {
      const dateParts = item.date.split('-');
      return `${dateParts[1]}/${dateParts[2]}`; // MM/DD format
    }),
    datasets: [
      {
        label: 'Incidents Logged',
        data: trend.map(item => item.count),
        fill: true,
        borderColor: 'rgba(59, 130, 246, 0.85)',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 33, 51, 0.92)',
        titleColor: '#e2eaf4',
        bodyColor: '#b8cad9',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(180,200,220,0.1)' },
        ticks: { color: 'var(--text-muted)', font: { size: 11 }, stepSize: 1 },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)', font: { size: 11 } },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your cybersecurity incident activity</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><FiAlertCircle /></div>
          <div className="stat-title">Open Incidents</div>
          <div className="stat-value">{kpi.open_incidents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiClock /></div>
          <div className="stat-title">Avg Resolution Time</div>
          <div className="stat-value">{Number(kpi.avg_resolution_days || 0).toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 500 }}>days</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)' }}><FiLayers /></div>
          <div className="stat-title">Impacted Categories</div>
          <div className="stat-value">{kpi.incidents_by_category.length}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-header">
            <div>
              <div className="chart-title">Incidents by Priority</div>
              <div className="chart-subtitle">Distribution of open incidents across priority levels</div>
            </div>
          </div>
          <div className="chart-canvas-wrapper">
            <Bar data={priorityChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <div>
              <div className="chart-title">Incidents by Category</div>
              <div className="chart-subtitle">Incident volume grouped by technical categories</div>
            </div>
          </div>
          <div className="chart-canvas-wrapper">
            <Bar data={categoryChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="chart-container full-width-chart">
        <div className="chart-header">
          <div>
            <div className="chart-title"><FiActivity style={{ marginRight: 6, verticalAlign: 'middle' }} /> Incident Activity Trend</div>
            <div className="chart-subtitle">Number of newly logged incidents over the last 7 days</div>
          </div>
        </div>
        <div className="chart-canvas-wrapper" style={{ height: '260px' }}>
          <Line data={trendChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;