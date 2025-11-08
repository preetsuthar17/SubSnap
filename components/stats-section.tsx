"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateAverageMonthlyCost,
  calculateMonthlyCost,
  calculateTotalSpent,
  calculateYearlyCost,
  getMostCostlySubscription,
  getNextRenewal,
  getRenewalsThisMonth,
  getTotalPrice,
  groupByCurrency,
  groupByDuration,
} from "@/lib/stats";
import type { Subscription } from "@/lib/types";

interface StatsSectionProps {
  subscriptions: Subscription[];
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function StatsSection({ subscriptions }: StatsSectionProps) {
  const currencies = Object.keys(groupByCurrency(subscriptions));
  const [selectedCurrency, setSelectedCurrency] = useState(
    currencies[0] || "USD"
  );

  const filteredSubscriptions = subscriptions.filter(
    (sub) => sub.currency === selectedCurrency
  );

  if (filteredSubscriptions.length === 0 && subscriptions.length > 0) {
    const allCurrencies = currencies.join(", ");
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
            <SelectTrigger className="w-32" id="currency-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-muted-foreground text-sm">
            No subscriptions found in {selectedCurrency}. Available currencies:{" "}
            {allCurrencies}
          </p>
        </div>
      </div>
    );
  }

  const totalMonthly = filteredSubscriptions.reduce(
    (sum, sub) => sum + calculateMonthlyCost(sub.price, sub.recurringDuration),
    0
  );

  const totalSpent = filteredSubscriptions.reduce(
    (sum, sub) => sum + calculateTotalSpent(sub),
    0
  );

  const mostCostly = getMostCostlySubscription(filteredSubscriptions);
  const averageMonthly = calculateAverageMonthlyCost(filteredSubscriptions);
  const yearlyCost = calculateYearlyCost(filteredSubscriptions);
  const renewalsThisMonth = getRenewalsThisMonth(filteredSubscriptions);
  const nextRenewal = getNextRenewal(filteredSubscriptions);
  const byDuration = groupByDuration(filteredSubscriptions);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
          <SelectTrigger className="w-32" id="currency-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.length > 0 ? (
              currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="USD">USD</SelectItem>
            )}
          </SelectContent>
        </Select>
        {currencies.length > 1 &&
          filteredSubscriptions.length < subscriptions.length && (
            <p className="text-muted-foreground text-xs">
              Showing {filteredSubscriptions.length} of {subscriptions.length}{" "}
              subscriptions
            </p>
          )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {filteredSubscriptions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {formatCurrency(totalMonthly, selectedCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatCurrency(yearlyCost, selectedCurrency)}/year
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {formatCurrency(totalSpent, selectedCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">
                Since subscriptions started
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Average Monthly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {formatCurrency(averageMonthly, selectedCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">Per subscription</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Yearly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {formatCurrency(yearlyCost, selectedCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">
                Estimated annual spending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Renewals This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {renewalsThisMonth.length}
              </div>
              <p className="text-muted-foreground text-xs">
                {renewalsThisMonth.length > 0
                  ? renewalsThisMonth
                      .slice(0, 2)
                      .map((sub) => sub.title)
                      .join(", ") +
                    (renewalsThisMonth.length > 2 ? "..." : "")
                  : "No renewals"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Next Renewal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextRenewal ? (
              <div className="flex flex-col gap-1">
                <div className="font-bold text-lg">
                  {nextRenewal.subscription.title}
                </div>
                <p className="text-muted-foreground text-xs">
                  {nextRenewal.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No upcoming renewals
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {Object.keys(byDuration).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Breakdown by Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Object.entries(byDuration).map(([duration, subs]) => {
                const durationTotal = subs.reduce(
                  (sum, sub) =>
                    sum +
                    calculateMonthlyCost(
                      getTotalPrice(sub),
                      sub.recurringDuration
                    ),
                  0
                );
                return (
                  <div
                    className="flex items-center justify-between"
                    key={duration}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm capitalize">
                        {duration.replace("-", " ")}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {subs.length} subscription{subs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="font-semibold text-sm">
                      {formatCurrency(durationTotal, selectedCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {mostCostly && (
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Most Costly Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-lg">{mostCostly.title}</div>
                <div className="text-muted-foreground text-sm">
                  {formatCurrency(
                    calculateMonthlyCost(
                      mostCostly.price,
                      mostCostly.recurringDuration
                    ),
                    selectedCurrency
                  )}{" "}
                  per month
                </div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="font-bold text-lg">
                  {formatCurrency(mostCostly.price, selectedCurrency)}
                </div>
                <div className="text-muted-foreground text-xs capitalize">
                  {mostCostly.recurringDuration.replace("-", " ")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
