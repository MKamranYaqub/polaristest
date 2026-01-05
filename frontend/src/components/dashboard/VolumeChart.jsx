import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VolumeChart = ({ title, total, data, type }) => {
  const navigate = useNavigate();

  // Define colors based on chart type - matching original CSS
  const getColor = (segment) => {
    if (type === 'btl') {
      const colorMap = {
        '2yr Fix': 'var(--token-chart-blue)',      // Blue
        '3yr Fix': 'var(--token-chart-blue-light)',      // Light Blue
        '2yr Tracker': 'var(--token-chart-purple)',  // Purple
      };
      return colorMap[segment] || 'var(--token-chart-blue)';
    } else {
      // Bridging
      const colorMap = {
        'Fusion': 'var(--token-chart-pink)',        // Pink
        'Fixed Bridge': 'var(--token-chart-yellow)',  // Yellow
        'Variable Bridge': 'var(--token-chart-orange)', // Orange
      };
      return colorMap[segment] || 'var(--token-chart-pink)';
    }
  };

  const handleViewQuotes = () => {
    navigate('/quotes');
  };

  const handleNewQuote = () => {
    if (type === 'btl') {
      navigate('/calculator/btl');
    } else {
      navigate('/calculator/bridging');
    }
  };

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(cat =>
    Object.values(cat.segments).reduce((sum, val) => sum + val, 0)
  ));

  // Format currency
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}m`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}k`;
    }
    return `£${value.toFixed(0)}`;
  };

  // Get all unique segment names
  const segmentNames = [...new Set(data.flatMap(cat => Object.keys(cat.segments)))];
  
  // Prepare datasets for Chart.js
  const datasets = segmentNames.map(segmentName => ({
    label: segmentName,
    data: data.map(cat => cat.segments[segmentName] || 0),
    backgroundColor: getColor(segmentName),
    borderColor: getColor(segmentName),
    borderWidth: 0,
  }));

  const chartData = {
    labels: data.map(cat => cat.label),
    datasets: datasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="volume-chart-container">
      <div className="volume-chart-header">
        <h3 className="volume-chart-title">{title}</h3>
        <div className="volume-chart-total">
          {formatCurrency(total)}
        </div>
      </div>

      <div className="volume-chart" style={{ height: '300px', marginBottom: '1rem' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="volume-chart-actions">
        <button
          className="slds-button slds-button_brand"
          onClick={handleViewQuotes}
        >
          View quotes
        </button>
        <button
          className="slds-button slds-button_issue-quote"
          onClick={handleNewQuote}
        >
          New quote
        </button>
      </div>
    </div>
  );
};

export default VolumeChart;
