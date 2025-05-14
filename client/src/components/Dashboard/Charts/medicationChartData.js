import moment from 'moment';

export const getMedicationChartData = (adherenceData, period) => {
  if (!adherenceData || adherenceData.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = adherenceData.map(entry => moment(entry.date).format('MMM D'));
  const takenDoses = adherenceData.map(entry => entry.takenDoses);
  const missedDoses = adherenceData.map(entry => entry.missedDoses);

  return {
    labels,
    datasets: [
      {
        label: 'Taken Doses',
        data: takenDoses,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Missed Doses',
        data: missedDoses,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };
};