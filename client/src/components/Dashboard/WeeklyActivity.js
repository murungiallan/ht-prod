import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { motion } from "framer-motion";
import { ChartOptions } from "chart.js";


const WeeklyActivity = ({ weeklyData, chartOptions, calorieChartRef, durationChartRef, sessionsChartRef }) => {
    const chartConfigs = {
      calories: {
        title: "Calories Burned (Last 7 Days)",
        icon: (
          <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c危機.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
        ),
        data: {
          labels: weeklyData.labels || [],
          datasets: [
            {
              label: "Calories Burned",
              data: weeklyData.calories || [],
              borderColor: "rgba(239, 68, 68, 1)",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              borderWidth: 1,
              pointBackgroundColor: "rgba(239, 68, 68, 1)",
              pointRadius: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            annotation: {
              annotations: {
                goalLine: {
                  type: 'line',
                  yMin: 2000 / 7,
                  yMax: 2000 / 7,
                  borderColor: 'rgba(255, 99, 132, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: 'Goal: ~285 cal/day',
                    enabled: true,
                    position: 'end',
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    color: 'white',
                    font: {
                      size: 10,
                    },
                  },
                },
              },
            },
          },
        },
      },
      duration: {
        title: "Duration in minutes (Last 7 Days)",
        icon: (
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        ),
        data: {
          labels: weeklyData.labels || [],
          datasets: [
            {
              label: "Duration",
              data: weeklyData.duration || [],
              borderColor: "rgba(59, 130, 246, 1)",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderWidth: 1,
              pointBackgroundColor: "rgba(59, 130, 246, 1)",
              pointRadius: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            annotation: {
              annotations: {
                goalLine: {
                  type: 'line',
                  yMin: 150 / 7,
                  yMax: 150 / 7,
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: 'Goal: ~21 min/day',
                    enabled: true,
                    position: 'end',
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    color: 'white',
                    font: {
                      size: 10,
                    },
                  },
                },
              },
            },
          },
        },
      },
      sessions: {
        title: "Total Sessions (Last 7 Days)",
        icon: (
          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2 2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
              clipRule="evenodd"
            />
          </svg>
        ),
        data: {
          labels: weeklyData.labels || [],
          datasets: [
            {
              label: "Sessions",
              data: weeklyData.sessions || [],
              borderColor: "rgba(16, 185, 129, 1)",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              borderWidth: 1,
              pointBackgroundColor: "rgba(16, 185, 129, 1)",
              pointRadius: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            annotation: {
              annotations: {
                goalLine: {
                  type: 'line',
                  yMin: 5 / 7,
                  yMax: 5 / 7,
                  borderColor: 'rgba(16, 185, 129, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: 'Goal: ~0.7 sessions/day',
                    enabled: true,
                    position: 'end',
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    color: 'white',
                    font: {
                      size: 10,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 w-full"
      >
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {/* Calories Burned Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full lg:w-[calc(50%-0.75rem)]">
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
              {chartConfigs.calories.icon}
              {chartConfigs.calories.title}
            </h3>
            <div className="h-64 w-full">
              {weeklyData.calories && weeklyData.calories.some(value => value > 0) ? (
                <Line ref={calorieChartRef} data={chartConfigs.calories.data} options={chartConfigs.calories.options} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No calorie data available for this period</p>
                </div>
              )}
            </div>
          </div>
          {/* Duration Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full lg:w-[calc(50%-0.75rem)]">
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
              {chartConfigs.duration.icon}
              {chartConfigs.duration.title}
            </h3>
            <div className="h-64 w-full">
              {weeklyData.duration && weeklyData.duration.some(value => value > 0) ? (
                <Line ref={durationChartRef} data={chartConfigs.duration.data} options={chartConfigs.duration.options} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No duration data available for this period</p>
                </div>
              )}
            </div>
          </div>
          {/* Sessions Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full">
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
              {chartConfigs.sessions.icon}
              {chartConfigs.sessions.title}
            </h3>
            <div className="h-64 w-full">
              {weeklyData.sessions && weeklyData.sessions.some(value => value > 0) ? (
                <Line ref={sessionsChartRef} data={chartConfigs.sessions.data} options={chartConfigs.sessions.options} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No sessions data available for this period</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
};

export default WeeklyActivity;