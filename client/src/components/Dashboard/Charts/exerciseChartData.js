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
      startDate = moment(today).subtract(10, 'years');
      days = moment(today).diff(startDate, 'days') + 1;
      break;
    default:
      startDate = moment(today).subtract(6, 'days');
      days = 7;
  }
  return { startDate, days };
};

const createChartConfig = (title, labels, data, color, yAxisLabel, goalValue, goalLabel) => ({
  title: `${title}`,
  icon: getIconByType(title),
  data: {
    labels,
    datasets: [
      {
        label: title.split(' ')[0],
        data,
        borderColor: color.border,
        backgroundColor: color.background,
        borderWidth: 1,
        pointBackgroundColor: color.border,
        pointRadius: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
          font: { size: 14, family: "'Inter', sans-serif" },
          color: "#6B7280",
        },
        ticks: { font: { size: 12, family: "'Inter', sans-serif" }, color: "#6B7280" },
        grid: { color: "rgba(209, 213, 219, 0.3)" },
        suggestedMax: Math.max(...data, goalValue) * 1.1 || 1000, // Dynamic max for alignment
      },
      x: {
        type: 'category',
        ticks: { font: { size: 12, family: "'Inter', sans-serif" }, color: "#6B7280" },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 10, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(31, 41, 55, 0.9)",
        padding: 12,
        titleFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" },
        bodyFont: { size: 14, family: "'Inter', sans-serif" },
        cornerRadius: 8,
      },
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: goalValue,
            yMax: goalValue,
            borderColor: `${color.border.replace('1)', '0.5)')}`,
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: goalLabel,
              enabled: true,
              position: 'end',
              backgroundColor: `${color.border.replace('1)', '0.8)')}`,
              color: 'white',
              font: { size: 10 },
            },
          },
        },
      },
    },
  },
});

const getIconByType = (title) => {
  if (title.includes("Calories")) {
    return (
      <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (title.includes("Duration")) {
    return (
      <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (title.includes("Sessions")) {
    return (
      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path
          fillRule="evenodd"
          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return null;
};

export const getExerciseChartData = (weeklyData, period, weeklyGoals) => {
    const { startDate, days } = getDateRange(period);
    const labels = weeklyData.labels && weeklyData.labels.length > 0
      ? weeklyData.labels
      : Array.from({ length: days }, (_, i) => 
          moment(startDate).add(i, 'days').format('MMM D')
        );
  
    const ensureDataLength = (data) => {
      if (!data || data.length === 0) return Array(labels.length).fill(0);
      return data.length === labels.length ? data : Array(labels.length).fill(0);
    };
  
    const caloriesData = ensureDataLength(weeklyData.calories);
    const durationData = ensureDataLength(weeklyData.duration);
    const sessionsData = ensureDataLength(weeklyData.sessions);
  
    const result = {
      calories: createChartConfig(
        `Calories Burned (${period})`,
        labels,
        caloriesData,
        { border: "rgba(239, 68, 68, 1)", background: "rgba(239, 68, 68, 0.2)" },
        "Calories Burned",
        weeklyGoals.weekly_exercise_calorie_goal ? weeklyGoals.weekly_exercise_calorie_goal / days : 2000 / days,
        weeklyGoals.weekly_exercise_calorie_goal 
          ? `Goal: ~${Math.round(weeklyGoals.weekly_exercise_calorie_goal / days)} cal/day`
          : `Goal: ~${Math.round(2000 / days)} cal/day`
      ),
      duration: createChartConfig(
        `Duration in minutes (${period})`,
        labels,
        durationData,
        { border: "rgba(59, 130, 246, 1)", background: "rgba(59, 130, 246, 0.2)" },
        "Duration (minutes)",
        150 / days,
        `Goal: ~${Math.round(150 / days)} min/day`
      ),
      sessions: createChartConfig(
        `Total Sessions (${period})`,
        labels,
        sessionsData,
        { border: "rgba(16, 185, 129, 1)", background: "rgba(16, 185, 129, 0.2)" },
        "Number of Sessions",
        5 / days,
        `Goal: ~${Math.round(5 / days * 10) / 10} sessions/day`
      ),
    };
  
    console.log("getExerciseChartData Result:", result);
    return result;
  };