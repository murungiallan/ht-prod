import moment from 'moment';

const getDateRange = (period) => {
  const today = moment().startOf('day');
  let startDate;
  let days;

  switch (period) {
    case "Last 7 Days":
      startDate = moment(today).subtract(6, 'days');
      days = 7;
      break;
    case "This Week":
      startDate = moment(today).startOf('week');
      days = moment(today).diff(startDate, 'days') + 1;
      break;
    case "Last Week":
      startDate = moment(today).subtract(1, 'weeks').startOf('week');
      days = 7;
      break;
    case "Last 14 Days":
      startDate = moment(today).subtract(13, 'days');
      days = 14;
      break;
    case "Last 30 Days":
      startDate = moment(today).subtract(29, 'days');
      days = 30;
      break;
    case "Last 1 Year":
      startDate = moment(today).subtract(1, 'years');
      days = 365;
      break;
    case "All Time":
      startDate = moment(today).subtract(10, 'years'); // Arbitrary large range for "All Time"
      days = moment(today).diff(startDate, 'days') + 1;
      break;
    default:
      startDate = moment(today).subtract(6, 'days');
      days = 7;
  }

  return { startDate, days };
};

const filterLogsByPeriod = (logs, period) => {
  const { startDate, days } = getDateRange(period);
  const endDate = moment().startOf('day');

  return logs.filter(log => {
    const logDate = moment(log.date_logged).startOf('day');
    return logDate.isSameOrAfter(startDate) && logDate.isSameOrBefore(endDate);
  });
};

const computeFoodChartData = (filteredLogs, days) => {
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = moment().subtract(days - 1 - i, 'days').startOf('day');
    return { date, shortDay: date.format('MMM D') };
  });

  const caloriesData = dateRange.map(({ date }) => {
    const dailyLogs = filteredLogs.filter(log => moment(log.date_logged).startOf('day').isSame(date));
    return dailyLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
  });

  return {
    labels: dateRange.map(d => d.shortDay),
    data: caloriesData,
  };
};

const computeMacrosChartData = (filteredLogs, days) => {
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = moment().subtract(days - 1 - i, 'days').startOf('day');
    return { date, shortDay: date.format('MMM D') };
  });

  const carbsData = dateRange.map(({ date }) => {
    const dailyLogs = filteredLogs.filter(log => moment(log.date_logged).startOf('day').isSame(date));
    return dailyLogs.reduce((sum, log) => sum + (Number(log.carbs) || 0), 0);
  });

  const proteinData = dateRange.map(({ date }) => {
    const dailyLogs = filteredLogs.filter(log => moment(log.date_logged).startOf('day').isSame(date));
    return dailyLogs.reduce((sum, log) => sum + (Number(log.protein) || 0), 0);
  });

  const fatsData = dateRange.map(({ date }) => {
    const dailyLogs = filteredLogs.filter(log => moment(log.date_logged).startOf('day').isSame(date));
    return dailyLogs.reduce((sum, log) => sum + (Number(log.fats) || 0), 0);
  });

  return {
    labels: dateRange.map(d => d.shortDay),
    datasets: [
      {
        label: 'Carbs',
        data: carbsData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Protein',
        data: proteinData,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Fats',
        data: fatsData,
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
    ],
  };
};

export const getFoodChartData = (foodLogs, foodStats, period, weeklyGoals) => {
  const filteredLogs = filterLogsByPeriod(foodLogs, period);
  const { days } = getDateRange(period);

  const foodChart = computeFoodChartData(filteredLogs, days);
  const macrosChart = computeMacrosChartData(filteredLogs, days);

  return {
    foodChartData: {
      labels: foodChart.labels,
      datasets: [
        {
          label: 'Calories',
          data: foodChart.data,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          pointRadius: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    macrosChartData: {
      labels: macrosChart.labels,
      datasets: macrosChart.datasets,
    },
  };
};