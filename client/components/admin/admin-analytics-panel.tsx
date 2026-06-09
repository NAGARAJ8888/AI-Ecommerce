"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { RefreshCcw, TrendingUp, DollarSign, ShieldCheck, AlertTriangle } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { adminGetOrderStats } from "@/lib/api-admin-orders";
import { adminGetPaymentStats } from "@/lib/api-admin-payments";
import { 
  adminGetProductStats,
  adminGetReviewStats,
  adminGetRecommendationAnalytics,
} from "@/lib/api-admin";




const COLORS = ["#22c55e", "#ef4444", "#6366f1", "#f59e0b", "#14b8a6", "#8b5cf6"];

type HealthBadgeProps = { label: string; variant: "good" | "warn" | "bad" | "neutral" };

function HealthBadge({ label, variant }: HealthBadgeProps) {
  const cls =
    variant === "good"
      ? "bg-green-100 text-green-700"
      : variant === "warn"
        ? "bg-yellow-100 text-yellow-700"
        : variant === "bad"
          ? "bg-red-100 text-red-700"
          : "bg-secondary text-foreground";

  return (
    <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${cls}`}>{label}</span>
  );
}

export function AdminAnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [orderStats, setOrderStats] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [recommendationAnalytics, setRecommendationAnalytics] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [o, p, pr, r, rec] = await Promise.all([
        adminGetOrderStats(),
        adminGetPaymentStats(),
        adminGetProductStats(),
        adminGetReviewStats(),
        adminGetRecommendationAnalytics(),
      ]);

      if (!o?.success) throw new Error(o?.message || "Failed to load order stats");
      if (!p?.success) throw new Error(p?.message || "Failed to load payment stats");
      if (!pr?.success) throw new Error(pr?.message || "Failed to load product stats");
      if (!r?.success) throw new Error(r?.message || "Failed to load review stats");
      if (!rec?.success) throw new Error(rec?.message || "Failed to load recommendation analytics");

      setOrderStats(o.data);
      setPaymentStats(p.data);
      setProductStats(pr.data);
      setReviewStats(r.data);
      setRecommendationAnalytics(rec.data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load operational analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const paymentHealth = useMemo(() => {
    const completed = paymentStats?.completedPayments ?? 0;
    const failed = paymentStats?.failedPayments ?? 0;
    const total = completed + failed;

    if (total === 0) return { badge: <HealthBadge label="No payments" variant="neutral" />, cls: "neutral" as const };
    const failRate = failed / total;

    if (failRate > 0.2) return { badge: <HealthBadge label={`High failure (${Math.round(failRate * 100)}%)`} variant="bad" />, cls: "bad" as const };
    if (failRate > 0.05) return { badge: <HealthBadge label={`Moderate failure (${Math.round(failRate * 100)}%)`} variant="warn" />, cls: "warn" as const };
    return { badge: <HealthBadge label="Payments look healthy" variant="good" />, cls: "good" as const };
  }, [paymentStats]);

  const reviewHealth = useMemo(() => {
    const sentiment = reviewStats?.sentiment;
    if (!sentiment) return <HealthBadge label="Sentiment unknown" variant="neutral" />;

    const total =
      (sentiment.positive ?? 0) + (sentiment.neutral ?? 0) + (sentiment.negative ?? 0);
    if (total === 0) return <HealthBadge label="No reviews" variant="neutral" />;

    const negRate = (sentiment.negative ?? 0) / total;
    if (negRate > 0.25) return <HealthBadge label={`High negative (${Math.round(negRate * 100)}%)`} variant="bad" />;
    if (negRate > 0.1) return <HealthBadge label={`Some negative (${Math.round(negRate * 100)}%)`} variant="warn" />;
    return <HealthBadge label="Review sentiment healthy" variant="good" />;
  }, [reviewStats]);

  // IMPORTANT: all hooks must be called unconditionally.
  // Keep loading/error returns AFTER derived memo hooks.
  const paymentPieData = useMemo(() => {
    const completed = paymentStats?.completedPayments ?? 0;
    const failed = paymentStats?.failedPayments ?? 0;
    return [
      { name: "completed", value: completed },
      { name: "failed", value: failed },
    ];
  }, [paymentStats]);

  const topActivity = useMemo(() => {
    const activityStats = recommendationAnalytics?.activityStats || {};
    const entries = Object.entries(activityStats) as Array<[string, number]>;
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [recommendationAnalytics]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Operational Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading operational analytics…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Operational Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
          <div className="mt-3">
            <Button size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-medium">Operational Analytics Dashboard</CardTitle>
            <div className="text-xs text-muted-foreground">
              Recruiter-visible health signals (no routing refactor, minimal charts).
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total Orders</div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-bold">{orderStats?.totalOrders ?? "-"}</div>
              <div className="mt-2">Last 7d orders: {orderStats?.recentOrders ?? "-"}</div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total Payments</div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-bold">{paymentStats?.totalPayments ?? "-"}</div>
              <div className="mt-2">Revenue: ${Number(paymentStats?.totalRevenue ?? 0).toFixed(2)}</div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Payment Health</div>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2">{paymentHealth.badge}</div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Review Sentiment</div>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2">{reviewHealth}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Payments status split</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paymentPieData} dataKey="value" nameKey="name" outerRadius={80}>
                    {paymentPieData.map((entry, idx) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Completed: {paymentStats?.completedPayments ?? 0} • Failed: {paymentStats?.failedPayments ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent operational signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Products</div>
                <div className="space-y-2 text-sm">
                  <div>Total: {productStats?.totalProducts ?? "-"}</div>
                  <div>In stock: {productStats?.inStock ?? "-"}</div>
                  <div>Low stock: {productStats?.lowStock ?? "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Reviews</div>
                <div className="space-y-2 text-sm">
                  <div>Total reviews: {reviewStats?.totalReviews ?? "-"}</div>
                  <div>Avg rating: {Number(reviewStats?.averageRating ?? 0).toFixed(2)}</div>
                  <div className="flex gap-2 flex-wrap">
                    <HealthBadge label={`Positive: ${reviewStats?.sentiment?.positive ?? 0}`} variant="good" />
                    <HealthBadge label={`Neutral: ${reviewStats?.sentiment?.neutral ?? 0}`} variant="neutral" />
                    <HealthBadge label={`Negative: ${reviewStats?.sentiment?.negative ?? 0}`} variant="warn" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Recommendation activity (top actions)</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topActivity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>No activity data</TableCell>
                    </TableRow>
                  ) : (
                    topActivity.map(([action, count]) => (
                      <TableRow key={action}>
                        <TableCell className="capitalize">{action}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recommendation correctness metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">
            Visibility-only (from analytics endpoint): total recommendations + recent docs.
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Recent products</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recommendationAnalytics?.recentRecommendations || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No recent recommendations</TableCell>
                </TableRow>
              ) : (
                (recommendationAnalytics?.recentRecommendations || []).slice(0, 5).map((doc: any) => (
                  <TableRow key={doc._id || doc.user || JSON.stringify(doc)}>
                    <TableCell>
                      {doc.user?.email || doc.user?.name || "-"}
                      <div className="text-xs text-muted-foreground">{doc.user?._id || ""}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(doc.recommendedProducts || []).slice(0, 3).map((p: any) => (
                          <span
                            key={p._id || p.id || p.name}
                            className="inline-flex w-fit px-2 py-0.5 text-xs rounded-sm bg-secondary text-foreground"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

