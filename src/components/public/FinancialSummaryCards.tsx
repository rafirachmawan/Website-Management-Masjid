import { financialSummary } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: number;
  description?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function SummaryCard({ title, value, description, trend, className }: SummaryCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {title}
            </p>
            <p className="mt-2 text-3xl md:text-4xl font-bold text-foreground tabular-nums">
              {formatCurrency(value)}
            </p>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                trend.value >= 0
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              <span aria-hidden="true">{trend.value >= 0 ? "▲" : "▼"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FinancialSummaryCards() {
  const { currentBalance, monthlyIncome, monthlyExpense, yearlyIncome, yearlyExpense } =
    financialSummary;

  return (
    <section aria-labelledby="summary-heading" className="py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          role="list"
        >
          <div role="listitem">
            <SummaryCard
              title="Saldo Kas Saat Ini"
              value={currentBalance}
              description="Terakhir diperbarui 27 Sep 2026"
            />
          </div>
          <div role="listitem">
            <SummaryCard
              title="Pemasukan Bulan Ini"
              value={monthlyIncome}
              description="September 2026"
              trend={{ value: 12, label: "vs bln lalu" }}
            />
          </div>
          <div role="listitem">
            <SummaryCard
              title="Pengeluaran Bulan Ini"
              value={monthlyExpense}
              description="September 2026"
              trend={{ value: -5, label: "vs bln lalu" }}
            />
          </div>
          <div role="listitem">
            <SummaryCard
              title="Selisih Bulanan"
              value={monthlyIncome - monthlyExpense}
              description="Surplus September 2026"
              trend={{ value: 18, label: "vs bln lalu" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}