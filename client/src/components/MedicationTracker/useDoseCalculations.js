import { useCallback, useMemo } from 'react';
import { isBefore, isAfter } from 'date-fns';
import moment from 'moment';

export const useDoseCalculations = (medications, selectedDate) => {
  const isPastDate = useCallback((date) =>
    isBefore(new Date(date), new Date(), { granularity: 'day' }), []);

  const isFutureDate = useCallback((date) =>
    isAfter(new Date(date), new Date(), { granularity: 'day' }), []);

  const getDoseStatus = useCallback((med, doseIndex, date) => {
    const effectiveDate = date || selectedDate;
    const dateKey = moment(effectiveDate).format('YYYY-MM-DD');
    const doses = med.doses?.[dateKey] || [];

    const dose = doses.find(d => d.doseIndex === doseIndex);
    if (!dose) {
      return {
        isTaken: false,
        isMissed: false,
        isTimeToTake: false,
        isWithinWindow: false,
        canTake: false,
      };
    }

    const now = moment().local();
    const [hours, minutes] = dose.time.split(':').map(Number);
    const doseDateTime = moment(effectiveDate)
      .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
      .local();

    const windowStart = moment(doseDateTime).subtract(2, 'hours');
    const windowEnd = moment(doseDateTime).add(2, 'hours');

    const isWithinWindow = now.isBetween(windowStart, windowEnd, undefined, '[]');
    const isTimeToTake = now.isSameOrAfter(doseDateTime);

    const canTake =
      !dose.taken &&
      !dose.missed &&
      isWithinWindow &&
      !isPastDate(effectiveDate) &&
      !isFutureDate(effectiveDate);

    return {
      isTaken: dose.taken,
      isMissed: dose.missed,
      isTimeToTake,
      isWithinWindow,
      canTake,
    };
  }, [selectedDate, isPastDate, isFutureDate]);

  const getMedicationsByTimeOfDay = useMemo(() => {
    const dateKey = moment(selectedDate).format('YYYY-MM-DD');

    const categorizeByTime = (timeCategory) => {
      const seen = new Set();
      return medications
        .flatMap(med => {
          const doses = med.doses?.[dateKey] || [];
          return doses.map(dose => {
            const [hours] = dose.time.split(':').map(Number);
            let shouldInclude = false;

            switch (timeCategory) {
              case 'morning':
                shouldInclude = hours >= 5 && hours < 12;
                break;
              case 'afternoon':
                shouldInclude = hours >= 12 && hours < 17;
                break;
              case 'evening':
                shouldInclude = hours >= 17 || hours < 5;
                break;
            }

            if (shouldInclude) {
              const key = `${med.id}-${dose.doseIndex}`;
              if (seen.has(key)) return null;
              seen.add(key);

              return {
                ...med,
                doseTime: dose.time,
                doseIndex: dose.doseIndex,
                timeOfDay: timeCategory.charAt(0).toUpperCase() + timeCategory.slice(1),
                selectedDate,
              };
            }
            return null;
          });
        })
        .filter(Boolean);
    };

    return {
      morning: categorizeByTime('morning'),
      afternoon: categorizeByTime('afternoon'),
      evening: categorizeByTime('evening'),
    };
  }, [medications, selectedDate]);

  return {
    getDoseStatus,
    getMedicationsByTimeOfDay,
    isPastDate,
    isFutureDate,
  };
};