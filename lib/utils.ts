import dayjs from "dayjs";

export const formatCurrency = (value: number, currency = "USD"): string => {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return value.toFixed(2);
    }
};

export const formatSubscriptionDateTime = (value?: string): string => {
    if (!value) return "Not provided";
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
    if (!value) return "Unknown";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Calculates the number of calendar days left between today and a future renewal date.
 * Returns 0 if the date has already passed or is invalid.
 */
export const calculateDaysLeft = (renewalDateValue?: string): number => {
    if (!renewalDateValue) return 0;
    
    const targetDate = dayjs(renewalDateValue);
    if (!targetDate.isValid()) return 0;

    const today = dayjs().startOf('day');
    const renewalDay = targetDate.startOf('day');

    // Calculate difference in whole days
    const daysLeft = renewalDay.diff(today, 'day');

    // Return 0 if the renewal date is in the past
    return daysLeft > 0 ? daysLeft : 0;
};