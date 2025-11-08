import type { RecurringDuration, Subscription } from "./types";

export function getTotalPrice(subscription: Subscription): number {
  if (subscription.charges && subscription.charges.length > 0) {
    return subscription.charges.reduce((sum, charge) => sum + charge.amount, 0);
  }
  return subscription.price;
}

export function calculateMonthlyCost(
  price: number,
  duration: RecurringDuration
): number {
  switch (duration) {
    case "weekly":
      return price * 4.33;
    case "bi-weekly":
      return price * 2.17;
    case "monthly":
      return price;
    case "quarterly":
      return price / 3;
    case "semi-annually":
      return price / 6;
    case "yearly":
      return price / 12;
    default:
      return price;
  }
}

function getDaysInDuration(duration: RecurringDuration): number {
  switch (duration) {
    case "weekly":
      return 7;
    case "bi-weekly":
      return 14;
    case "monthly":
      return 30;
    case "quarterly":
      return 90;
    case "semi-annually":
      return 180;
    case "yearly":
      return 365;
    default:
      return 30;
  }
}

export function calculateTotalSpent(subscription: Subscription): number {
  const now = new Date();
  const startDate = new Date(subscription.startDate);

  if (startDate > now) {
    return 0;
  }

  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysInDuration = getDaysInDuration(subscription.recurringDuration);
  const billingCycles = Math.floor(daysSinceStart / daysInDuration) + 1;

  const totalPrice = getTotalPrice(subscription);
  return totalPrice * billingCycles;
}

export function getMostCostlySubscription(
  subscriptions: Subscription[]
): Subscription | null {
  if (subscriptions.length === 0) return null;

  return subscriptions.reduce((mostCostly, current) => {
    const mostCostlyTotal = getTotalPrice(mostCostly);
    const currentTotal = getTotalPrice(current);
    const mostCostlyMonthly = calculateMonthlyCost(
      mostCostlyTotal,
      mostCostly.recurringDuration
    );
    const currentMonthly = calculateMonthlyCost(
      currentTotal,
      current.recurringDuration
    );
    return currentMonthly > mostCostlyMonthly ? current : mostCostly;
  });
}

export function calculateAverageMonthlyCost(
  subscriptions: Subscription[]
): number {
  if (subscriptions.length === 0) return 0;

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    const totalPrice = getTotalPrice(sub);
    return sum + calculateMonthlyCost(totalPrice, sub.recurringDuration);
  }, 0);

  return totalMonthly / subscriptions.length;
}

export function groupByCurrency(
  subscriptions: Subscription[]
): Record<string, Subscription[]> {
  return subscriptions.reduce(
    (acc, sub) => {
      if (!acc[sub.currency]) {
        acc[sub.currency] = [];
      }
      acc[sub.currency].push(sub);
      return acc;
    },
    {} as Record<string, Subscription[]>
  );
}

export function calculateNextRenewalDate(subscription: Subscription): Date {
  const startDate = new Date(subscription.startDate);
  const now = new Date();

  if (startDate > now) {
    return startDate;
  }

  const nextRenewal = new Date(startDate);

  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysInDuration = getDaysInDuration(subscription.recurringDuration);
  const cyclesPassed = Math.floor(daysSinceStart / daysInDuration);

  switch (subscription.recurringDuration) {
    case "weekly":
      nextRenewal.setDate(startDate.getDate() + (cyclesPassed + 1) * 7);
      break;
    case "bi-weekly":
      nextRenewal.setDate(startDate.getDate() + (cyclesPassed + 1) * 14);
      break;
    case "monthly":
      nextRenewal.setMonth(startDate.getMonth() + cyclesPassed + 1);
      break;
    case "quarterly":
      nextRenewal.setMonth(startDate.getMonth() + (cyclesPassed + 1) * 3);
      break;
    case "semi-annually":
      nextRenewal.setMonth(startDate.getMonth() + (cyclesPassed + 1) * 6);
      break;
    case "yearly":
      nextRenewal.setFullYear(startDate.getFullYear() + cyclesPassed + 1);
      break;
  }

  if (nextRenewal <= now) {
    switch (subscription.recurringDuration) {
      case "weekly":
        nextRenewal.setDate(nextRenewal.getDate() + 7);
        break;
      case "bi-weekly":
        nextRenewal.setDate(nextRenewal.getDate() + 14);
        break;
      case "monthly":
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        break;
      case "quarterly":
        nextRenewal.setMonth(nextRenewal.getMonth() + 3);
        break;
      case "semi-annually":
        nextRenewal.setMonth(nextRenewal.getMonth() + 6);
        break;
      case "yearly":
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        break;
    }
  }

  return nextRenewal;
}

export function calculateYearlyCost(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => {
    const totalPrice = getTotalPrice(sub);
    const monthlyCost = calculateMonthlyCost(totalPrice, sub.recurringDuration);
    return sum + monthlyCost * 12;
  }, 0);
}

export function getUpcomingRenewals(
  subscriptions: Subscription[],
  daysAhead: number = 30
): Subscription[] {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);

  return subscriptions
    .map((sub) => ({
      subscription: sub,
      nextRenewal: calculateNextRenewalDate(sub),
    }))
    .filter(
      ({ nextRenewal }) => nextRenewal >= now && nextRenewal <= futureDate
    )
    .sort((a, b) => a.nextRenewal.getTime() - b.nextRenewal.getTime())
    .map(({ subscription }) => subscription);
}

export function getRenewalsThisMonth(
  subscriptions: Subscription[]
): Subscription[] {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return subscriptions
    .map((sub) => ({
      subscription: sub,
      nextRenewal: calculateNextRenewalDate(sub),
    }))
    .filter(
      ({ nextRenewal }) =>
        nextRenewal >= startOfMonth && nextRenewal <= endOfMonth
    )
    .sort((a, b) => a.nextRenewal.getTime() - b.nextRenewal.getTime())
    .map(({ subscription }) => subscription);
}

export function groupByDuration(
  subscriptions: Subscription[]
): Record<RecurringDuration, Subscription[]> {
  return subscriptions.reduce(
    (acc, sub) => {
      if (!acc[sub.recurringDuration]) {
        acc[sub.recurringDuration] = [];
      }
      acc[sub.recurringDuration].push(sub);
      return acc;
    },
    {} as Record<RecurringDuration, Subscription[]>
  );
}

export function getNextRenewal(subscriptions: Subscription[]): {
  subscription: Subscription;
  date: Date;
} | null {
  if (subscriptions.length === 0) return null;

  const renewals = subscriptions
    .map((sub) => ({
      subscription: sub,
      date: calculateNextRenewalDate(sub),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return renewals[0];
}
