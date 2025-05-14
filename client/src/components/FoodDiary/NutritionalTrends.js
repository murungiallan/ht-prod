import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement } from 'chart.js';
import moment from 'moment';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement);

// NutritionalTrends component displays two charts: one for calories and predictions, another for macros
const NutritionalTrends = ({ stats, caloriePredictions }) => {
  const caloriesChartRef = useRef(null);
  const macrosChartRef = useRef(null);

  // Data Processing: Generate chart data for calories and macros separately
  const { caloriesChartData, macrosChartData } = useMemo(() => {
    if (!stats || stats.length === 0) {
      return {
        caloriesChartData: { labels: [], datasets: [] },
        macrosChartData: { labels: [], datasets: [] },
      };
    }

    try {
      // Aggregate stats by date
      const aggregatedStats = stats.reduce((acc, stat) => {
        const date = moment(stat.logDate).format('MMM D');
        if (!acc[date]) {
          acc[date] = {
            totalCalories: 0,
            totalCarbs: 0,
            totalProtein: 0,
            totalFats: 0,
            count: 0,
          };
        }
        acc[date].totalCalories += parseFloat(stat.totalCalories) || 0;
        acc[date].totalCarbs += parseFloat(stat.totalCarbs) || 0;
        acc[date].totalProtein += parseFloat(stat.totalProtein) || 0;
        acc[date].totalFats += parseFloat(stat.totalFats) || 0;
        acc[date].count += 1;
        return acc;
      }, {});

      // Calculate totals per day
      const historicalLabels = Object.keys(aggregatedStats).sort((a, b) => moment(a, 'MMM D').diff(moment(b, 'MMM D')));
      const historicalCalories = historicalLabels.map(label => aggregatedStats[label].totalCalories);
      const historicalCarbs = historicalLabels.map(label => aggregatedStats[label].totalCarbs);
      const historicalProtein = historicalLabels.map(label => aggregatedStats[label].totalProtein);
      const historicalFats = historicalLabels.map(label => aggregatedStats[label].totalFats);

      // Prediction data for calories
      const lastDate = historicalLabels.length > 0 ? moment(historicalLabels[historicalLabels.length - 1], 'MMM D') : moment();
      const predictionLabels = [];
      const predictionValues = caloriePredictions.map(pred => parseFloat(pred.value) || 0);

      for (let i = 1; i <= 7; i++) {
        predictionLabels.push(lastDate.clone().add(i, 'days').format('MMM D'));
      }

      // Combine labels for calories chart (historical + predictions)
      const caloriesChartData = {
        labels: [...historicalLabels, ...predictionLabels],
        datasets: [
          {
            label: 'Calories',
            data: [...historicalCalories, ...new Array(7).fill(null)],
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            type: 'line',
          },
          {
            label: 'Predicted Calories',
            data: [...new Array(historicalCalories.length).fill(null), ...predictionValues],
            borderColor: 'rgba(239, 68, 68, 0.6)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderDash: [5, 5],
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            type: 'line',
          },
        ],
      };

      // Labels for macros chart (historical only, no predictions)
      const macrosChartData = {
        labels: historicalLabels,
        datasets: [
          {
            label: 'Carbs',
            data: historicalCarbs,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            type: 'bar',
          },
          {
            label: 'Protein',
            data: historicalProtein,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            type: 'bar',
          },
          {
            label: 'Fats',
            data: historicalFats,
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
            type: 'bar',
          },
        ],
      };

      return { caloriesChartData, macrosChartData };
    } catch (err) {
      console.error('Error generating chart data:', err);
      return {
        caloriesChartData: { labels: [], datasets: [] },
        macrosChartData: { labels: [], datasets: [] },
      };
    }
  }, [stats, caloriePredictions]);

  // Utilities: Define chart options for calories (line) chart
  const caloriesChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Calories (kcal)', font: { size: 12 } },
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

  // Utilities: Define chart options for macros (bar) chart
  const macrosChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Amount (g)', font: { size: 12 } },
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

  // Cleanup chart instances on unmount or data change
  useEffect(() => {
    return () => {
      if (caloriesChartRef.current) {
        const chartInstance = ChartJS.getChart(caloriesChartRef.current);
        chartInstance?.destroy();
      }
      if (macrosChartRef.current) {
        const chartInstance = ChartJS.getChart(macrosChartRef.current);
        chartInstance?.destroy();
      }
    };
  }, [stats, caloriePredictions]);

  return (
    <div className="charts-container flex flex-col sm:flex-row gap-6">
      {/* Calories Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-white p-6 rounded-xl shadow-md w-full sm:w-1/2"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Caloric Trends</h2>
        <p className="text-sm text-gray-500 mb-4">
          Predicted calories (dashed line) are based on ARIMA forecasting for the next 7 days.
        </p>
        <div className="h-64 sm:h-80">
          {caloriesChartData.labels.length > 0 ? (
            <Line
              ref={caloriesChartRef}
              data={caloriesChartData}
              options={caloriesChartOptions}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No caloric data available for this period
            </div>
          )}
        </div>
      </motion.div>

      {/* Macros Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-white p-6 rounded-xl shadow-md w-full sm:w-1/2"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Macronutrient Trends</h2>
        <p className="text-sm text-gray-500 mb-4">
          Daily totals for Carbs, Protein, and Fats.
        </p>
        <div className="h-64 sm:h-80">
          {macrosChartData.labels.length > 0 ? (
            <Line
              ref={macrosChartRef}
              data={macrosChartData}
              options={macrosChartOptions}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No macronutrient data available for this period
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NutritionalTrends;