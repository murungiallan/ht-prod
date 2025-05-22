import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, BarElement, ArcElement, registerables } from 'chart.js';
import moment from 'moment';

// Register all Chart.js components
ChartJS.register(...registerables, LineElement, PointElement, LinearScale, CategoryScale, BarElement, ArcElement);

// ErrorBoundary component to catch and handle errors
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Error loading chart data. Please try again later.
        </div>
      );
    }
    return this.props.children;
  }
}

// ActivityChart component to display overall activity charts
const ActivityChart = ({ type, labels, data, title, error = null, loading = false, usersData = [] }) => {
  const chartRef = useRef(null);
  const isMounted = useRef(false);

  // Helper function to parse and format dates to MMM D for chart labels
  const parseDateForLabel = (dateStr) => {
    if (!dateStr) return null;
    // Use strict parsing with moment to match the format of the date string
    return moment(dateStr, ['YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss.SSSZ'], true).format('MMM D');
  };

  const chartData = useMemo(() => {
    try {
      let datasets = [];
      let xAxisLabel = 'Week Starting';
      let yAxisLabel = 'Count';

      if (!Array.isArray(labels)) {
        throw new Error('Labels must be an array');
      }

      const processedLabels = labels.map(label => {
        if (typeof label === 'string' && (label.includes('T') || label.includes(':'))) {
          return parseDateForLabel(label) || label;
        }
        return label;
      });

      switch (title.toLowerCase()) {
        case 'users joined weekly':
          if (!Array.isArray(data)) throw new Error('Data must be an array for Users Joined Weekly');
          datasets = [
            {
              label: 'Total Users',
              data,
              borderColor: 'rgba(75, 94, 252, 1)',
              backgroundColor: 'rgba(75, 94, 252, 0.2)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ];
          yAxisLabel = 'Total Users';
          break;

        case 'recently used medications weekly':
          if (!Array.isArray(data)) throw new Error('Data must be an array for Recently Used Medications Weekly');
          datasets = [
            {
              label: 'Usage Count',
              data,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            },
          ];
          yAxisLabel = 'Usage Count';
          break;

        case 'taken vs missed doses weekly':
          if (!data || !Array.isArray(data.takenDoses) || !Array.isArray(data.missedDoses)) {
            throw new Error('Data must contain takenDoses and missedDoses arrays for Taken vs Missed Doses Weekly');
          }
          if (data.takenDoses.length !== labels.length || data.missedDoses.length !== labels.length) {
            throw new Error('Data length must match labels length for Taken vs Missed Doses Weekly');
          }
          datasets = [
            {
              label: 'Taken',
              data: data.takenDoses,
              borderColor: 'rgba(34, 197, 94, 1)',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Missed',
              data: data.missedDoses,
              borderColor: 'rgba(239, 68, 68, 1)',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ];
          yAxisLabel = 'Number of Doses';
          break;

        case 'total calories weekly':
          if (!Array.isArray(data)) throw new Error('Data must be an array for Total Calories Weekly');
          datasets = [
            {
              label: 'Total Calories',
              data,
              borderColor: 'rgba(132, 204, 22, 1)',
              backgroundColor: 'rgba(132, 204, 22, 0.2)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ];
          yAxisLabel = 'Total Calories';
          break;

        case 'total macronutrients consumed weekly':
          if (!Array.isArray(data)) throw new Error('Data must be an array for Total Macronutrients Consumed Weekly');
          datasets = [
            {
              label: 'Total Macros',
              data,
              borderColor: 'rgba(245, 158, 11, 1)',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ];
          yAxisLabel = 'Total Grams';
          break;

        case 'total calories burned weekly':
          if (!Array.isArray(data)) throw new Error('Data must be an array for Total Calories Burned Weekly');
          datasets = [
            {
              label: 'Total Calories Burned',
              data,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            },
          ];
          yAxisLabel = 'Total Calories Burned';
          break;

        case 'exercise types in percentage':
          if (!Array.isArray(data)) throw new Error('Data must be an array for Exercise Types in Percentage');
          datasets = [
            {
              data,
              backgroundColor: processedLabels.map((_, index) => `hsl(${(index * 60) % 360}, 70%, 60%)`),
              borderWidth: 1,
            },
          ];
          yAxisLabel = 'Percentage';
          break;

        default:
          if (!Array.isArray(data)) throw new Error('Data must be an array for default chart type');
          datasets = [
            {
              label: title,
              data,
              borderColor: 'rgba(75, 94, 252, 1)',
              backgroundColor: 'rgba(75, 94, 252, 0.2)',
              fill: type === 'line',
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ];
      }

      return { labels: processedLabels, datasets, xAxisLabel, yAxisLabel };
    } catch (err) {
      console.error('Error generating chart data:', err);
      return { labels: [], datasets: [], xAxisLabel: 'Week Starting', yAxisLabel: 'Count' };
    }
  }, [labels, data, title]);

  // Chart options configuration
  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 12 }, padding: 20 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
              return `${context.dataset.label || context.label}: ${value}`;
            },
          },
        },
      },
      hover: {
        mode: 'index',
        intersect: false,
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
      },
    };

    if (type === 'pie') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = ((value / total) * 100).toFixed(2);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      };
    }

    if (type === 'bar') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: chartData.yAxisLabel, font: { size: 12 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { font: { size: 12 } },
          },
          x: {
            title: { display: true, text: chartData.xAxisLabel, font: { size: 12 } },
            grid: { display: false },
            ticks: { font: { size: 12 }, maxRotation: 45, minRotation: 45 },
          },
        },
      };
    }

    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: chartData.yAxisLabel, font: { size: 12 } },
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { size: 12 } },
        },
        x: {
          title: { display: true, text: chartData.xAxisLabel, font: { size: 12 } },
          grid: { display: false },
          ticks: { font: { size: 12 }, maxRotation: 45, minRotation: 45 },
        },
      },
    };
  }, [chartData.xAxisLabel, chartData.yAxisLabel, type]);

  // Initialize and cleanup chart instances
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (chartRef.current && chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }
    };
  }, []);

  // Render the appropriate chart based on type
  const renderChart = () => {
    const data = {
      labels: chartData.labels,
      datasets: chartData.datasets,
    };

    switch (type) {
      case 'line':
        return <Line ref={chartRef} data={data} options={chartOptions} />;
      case 'bar':
        return <Bar ref={chartRef} data={data} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-md w-full h-80"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-700">{title}</h2>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-600 text-sm">
          {error}
        </div>
      ) : (
        <ErrorBoundary>
          {chartData.labels.length > 0 && chartData.datasets.length > 0 && isMounted.current ? (
            <div className="h-64">{renderChart()}</div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
              No data available to display.
            </div>
          )}
        </ErrorBoundary>
      )}
    </motion.div>
  );
};

export default ActivityChart;