import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

// NutritionalTrends component displays a line chart of nutritional trends and caloric predictions
const NutritionalTrends = ({ stats, caloriePredictions }) => {
  // Initialization: Define chart colors and styling constants
  const chartColors = {
    calories: { border: 'rgba(239, 68, 68, 1)', background: 'rgba(239, 68, 68, 0.1)' },
    carbs: { border: 'rgba(59, 130, 246, 1)', background: 'rgba(59, 130, 246, 0.1)' },
    protein: { border: 'rgba(16, 185, 129, 1)', background: 'rgba(16, 185, 129, 0.1)' },
    fats: { border: 'rgba(255, 206, 86, 1)', background: 'rgba(255, 206, 86, 0.1)' },
    predicted: { border: 'rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.05)' },
  };

  // Data Processing: Generate chart data from stats and predictions
  const chartData = useMemo(() => {
    if (!stats || stats.length === 0) return { labels: [], datasets: [] };

    try {
      // Historical data labels and values
      const historicalLabels = stats.map(stat => moment(stat.logDate).format('MMM D'));
      const historicalCalories = stats.map(stat => parseFloat(stat.totalCalories) || 0);

      // Prediction data
      const lastDate = stats.length > 0 ? moment(stats[stats.length - 1].logDate) : moment();
      const predictionLabels = [];
      const predictionValues = caloriePredictions.map(pred => parseFloat(pred.value) || 0);

      for (let i = 1; i <= 7; i++) {
        predictionLabels.push(lastDate.clone().add(i, 'days').format('MMM D'));
      }

      // Combine labels and data
      const labels = [...historicalLabels, ...predictionLabels];
      const datasets = [
        {
          label: 'Calories',
          data: [...historicalCalories, ...new Array(7).fill(null)],
          borderColor: chartColors.calories.border,
          backgroundColor: chartColors.calories.background,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Predicted Calories',
          data: [...new Array(historicalCalories.length).fill(null), ...predictionValues],
          borderColor: chartColors.predicted.border,
          backgroundColor: chartColors.predicted.background,
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Carbs',
          data: stats.map(stat => parseFloat(stat.totalCarbs) || 0),
          borderColor: chartColors.carbs.border,
          backgroundColor: chartColors.carbs.background,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Protein',
          data: stats.map(stat => parseFloat(stat.totalProtein) || 0),
          borderColor: chartColors.protein.border,
          backgroundColor: chartColors.protein.background,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Fats',
          data: stats.map(stat => parseFloat(stat.totalFats) || 0),
          borderColor: chartColors.fats.border,
          backgroundColor: chartColors.fats.background,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ];

      return { labels, datasets };
    } catch (err) {
      console.error('Error generating chart data:', err);
      return { labels: [], datasets: [] };
    }
  }, [stats, caloriePredictions]);

  // Utilities: Define chart options for styling and interactivity
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Amount', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 12 } },
      },
      x: {
        title: { display: true, text: 'Date', font: { size: 12 } },
        grid: { display: false },
        ticks: { font: { size: 12 }, maxRotation: 45, minRotation: 45 },
      },
    },
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
  }), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-md"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Nutritional Trends</h2>
      <p className="text-sm text-gray-500 mb-4">
        Predicted calories (dashed line) are based on ARIMA forecasting for the next 7 days.
      </p>
      <div className="h-64 sm:h-80">
        {chartData.labels.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No nutritional data available for this period
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NutritionalTrends;