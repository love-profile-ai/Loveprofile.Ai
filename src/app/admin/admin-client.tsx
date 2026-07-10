"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  CircleSlash,
  ClipboardList,
  FileText,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LockKeyhole,
  Music,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { SITE_NAME } from "@/lib/site";

type Tab =
  | "dashboard"
  | "users"
  | "questions"
  | "adaptive"
  | "reports"
  | "settings"
  | "content"
  | "music"
  | "audit";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  role: string;
  approval_status: string;
  created_at: string;
  last_login_at: string | null;
  last_ip: string | null;
  country: string | null;
  browser: string | null;
  device: string | null;
  reports_generated: number;
}

interface AdaptiveQuestionRow {
  id: string;
  path: string;
  category: string;
  question_text: string;
  type: string;
  psychological_dimension: string;
  priority: number;
  is_active: boolean;
  is_starter: boolean;
  is_clarification: boolean;
  parent_question_id: string | null;
}

interface ReportRow {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  title: string;
  path: string;
  confidence: string;
  assessment_session_id: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  user_email: string | null;
  path: string;
  status: string;
  question_count: number;
  created_at: string;
}

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "questions", label: "Questionnaire", icon: ListChecks },
  { id: "adaptive", label: "Adaptive", icon: Brain },
  { id: "reports", label: "Reports", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "content", label: "Content", icon: FileText },
  { id: "music", label: "Music", icon: Music },
  { id: "audit", label: "Audit", icon: Shield },
];

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card p-5"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <p className="font-display text-3xl font-semibold">{value}</p>
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/45">
        {label}
      </p>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : status === "pending"
        ? "bg-gold/12 text-gold"
        : "bg-destructive/10 text-destructive";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}>
      {status}
    </span>
  );
}

export function AdminClient({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Record<string, string | number>>({});
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestionRow[]>([]);
  const [adaptivePathFilter, setAdaptivePathFilter] = useState("");
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [sessionRows, setSessionRows] = useState<SessionRow[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [music, setMusic] = useState<{ tracks: any[]; settings: any }>({
    tracks: [],
    settings: {},
  });
  const [audit, setAudit] = useState<{ logs: any[]; notifications: any[] }>({
    logs: [],
    notifications: [],
  });

  async function loadAll() {
    setLoading(true);
    const [overviewRes, usersRes, settingsRes, questionsRes, adaptiveRes, reportsRes, musicRes, auditRes] =
      await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/users"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/questions"),
        fetch("/api/admin/adaptive-questions"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/music"),
        fetch("/api/admin/audit"),
      ]);

    const [overviewData, usersData, settingsData, questionsData, adaptiveData, reportsData, musicData, auditData] =
      await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        settingsRes.json(),
        questionsRes.json(),
        adaptiveRes.json(),
        reportsRes.json(),
        musicRes.json(),
        auditRes.json(),
      ]);

    setOverview(overviewData.metrics ?? {});
    setUsers(usersData.users ?? []);
    setSettings(settingsData.settings ?? {});
    setQuestions(questionsData.questions ?? []);
    setAdaptiveQuestions(adaptiveData.questions ?? []);
    setReportRows(reportsData.reports ?? []);
    setSessionRows(reportsData.sessions ?? []);
    setMusic({ tracks: musicData.tracks ?? [], settings: musicData.settings ?? {} });
    setAudit({
      logs: auditData.logs ?? [],
      notifications: auditData.notifications ?? [],
    });
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const pendingUsers = useMemo(
    () => users.filter((u) => u.approval_status === "pending"),
    [users]
  );

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      const text = `${user.email ?? ""} ${user.full_name ?? ""} ${user.display_name ?? ""} ${user.role}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesFilter = !filter || user.approval_status === filter || user.provider === filter || user.role === filter;
      return matchesQuery && matchesFilter;
    });
  }, [users, query, filter]);

  const pendingCount = useMemo(
    () => Number(overview.pendingApprovals ?? users.filter((u) => u.approval_status === "pending").length),
    [overview.pendingApprovals, users]
  );

  const visibleAdaptiveQuestions = useMemo(() => {
    if (!adaptivePathFilter) return adaptiveQuestions;
    return adaptiveQuestions.filter((q) => q.path === adaptivePathFilter);
  }, [adaptiveQuestions, adaptivePathFilter]);

  const allVisibleSelected =
    visibleUsers.length > 0 && visibleUsers.every((u) => selectedUserIds.includes(u.id));

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(visibleUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelectedUserIds((prev) => [
      ...prev,
      ...visibleUsers.map((u) => u.id).filter((id) => !prev.includes(id)),
    ]);
  }

  async function bulkUpdateUsers(action: "approve" | "reject") {
    if (!selectedUserIds.length) return;
    await updateUsers(selectedUserIds, action);
    setSelectedUserIds([]);
  }

  async function updateUsers(userIds: string[], action: string) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, action }),
    });
    await loadAll();
  }

  async function deleteUser(userId: string) {
    if (!confirm("Delete this user permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    await loadAll();
  }

  async function resetUserData(userId: string) {
    if (!confirm("Reset this user's reports, sessions, and chat messages?")) return;
    await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_data" }),
    });
    await loadAll();
  }

  async function toggleMaintenance() {
    const current = settings.maintenance ?? {};
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "maintenance",
        value: { ...current, enabled: !current.enabled },
      }),
    });
    await loadAll();
  }

  async function toggleMusic() {
    const current = music.settings ?? {};
    await fetch("/api/admin/music", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: { ...current, enabled: !current.enabled },
      }),
    });
    await loadAll();
  }

  async function toggleAdaptiveQuestion(id: string, is_active: boolean) {
    await fetch("/api/admin/adaptive-questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    });
    await loadAll();
  }

  async function deleteReportOrSession(type: "report" | "session", id: string) {
    const label = type === "report" ? "report" : "assessment session";
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    await fetch(`/api/admin/reports?type=${type}&id=${id}`, { method: "DELETE" });
    if (selectedReport?.id === id) setSelectedReport(null);
    await loadAll();
  }

  return (
    <div className="landing-canvas min-h-screen">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="floating-nav lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-72 lg:rounded-[2rem] lg:p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole className="size-5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">{SITE_NAME} Admin</p>
              <p className="text-xs font-semibold text-foreground/45">{adminEmail}</p>
            </div>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${
                  tab === item.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-foreground/62 hover:bg-primary/8 hover:text-primary"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
                {item.id === "users" && pendingCount > 0 && (
                  <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-12">
          <header className="premium-card mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-label">Enterprise Control Center</p>
              <h1 className="text-heading-page mt-2">Operate {SITE_NAME} with clarity.</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Global search"
                  className="premium-input w-full rounded-full pl-11 sm:w-72"
                />
              </div>
              <Button variant="outline" onClick={loadAll}>
                Refresh
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="premium-card flex min-h-96 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {tab === "dashboard" && (
                <section className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard label="Total Users" value={overview.totalUsers ?? 0} icon={Users} />
                    <MetricCard label="Active Users" value={overview.activeUsers ?? 0} icon={Activity} />
                    <MetricCard label="Pending" value={overview.pendingApprovals ?? 0} icon={Bell} />
                    <MetricCard label="Reports" value={overview.reportsGenerated ?? 0} icon={BarChart3} />
                    <MetricCard label="Sessions" value={overview.activeSessions ?? 0} icon={Sparkles} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="premium-card p-6">
                      <p className="text-label">Website Status</p>
                      <h2 className="mt-3 font-display text-3xl font-semibold">{overview.websiteStatus}</h2>
                      <Button className="mt-6" variant="outline" onClick={toggleMaintenance}>
                        {settings.maintenance?.enabled ? "Disable" : "Enable"} Maintenance
                      </Button>
                    </div>
                    <div className="premium-card p-6">
                      <p className="text-label">Background Music</p>
                      <h2 className="mt-3 font-display text-3xl font-semibold">{overview.backgroundMusicStatus}</h2>
                      <Button className="mt-6" variant="outline" onClick={toggleMusic}>
                        {music.settings?.enabled ? "Disable" : "Enable"} Music
                      </Button>
                    </div>
                    <div className="premium-card p-6">
                      <p className="text-label">Approval Rate</p>
                      <h2 className="mt-3 font-display text-3xl font-semibold">
                        {users.length
                          ? Math.round(
                              (users.filter((u) => u.approval_status === "approved").length /
                                users.length) *
                                100
                            )
                          : 0}
                        %
                      </h2>
                      <div className="mt-6 h-3 overflow-hidden rounded-full bg-primary/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold" style={{ width: "72%" }} />
                      </div>
                    </div>
                  </div>

                  {pendingUsers.length > 0 && (
                    <div className="premium-card p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-label">Pending approvals</p>
                          <h2 className="font-display text-2xl font-semibold">
                            {pendingUsers.length} user{pendingUsers.length === 1 ? "" : "s"} waiting
                          </h2>
                        </div>
                        <Button
                          onClick={() => {
                            setTab("users");
                            setFilter("pending");
                          }}
                        >
                          Open Users tab
                        </Button>
                      </div>
                      <div className="mt-5 space-y-3">
                        {pendingUsers.slice(0, 5).map((user) => (
                          <div
                            key={user.id}
                            className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white/35 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-white/[0.04]"
                          >
                            <div>
                              <p className="font-bold">{user.full_name ?? user.display_name ?? "Unnamed user"}</p>
                              <p className="text-xs font-semibold text-foreground/45">{user.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateUsers([user.id], "approve")}>
                                <CheckCircle2 className="size-3" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateUsers([user.id], "reject")}>
                                <XCircle className="size-3" /> Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {tab === "users" && (
                <section className="premium-card overflow-hidden">
                  <div className="flex flex-col gap-4 border-b border-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-label">User Management</p>
                      <h2 className="font-display text-3xl font-semibold">Registered users</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedUserIds.length > 0 && (
                        <>
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/50">
                            {selectedUserIds.length} selected
                          </span>
                          <Button size="sm" onClick={() => bulkUpdateUsers("approve")}>
                            <CheckCircle2 className="size-3" /> Approve selected
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => bulkUpdateUsers("reject")}>
                            <XCircle className="size-3" /> Reject selected
                          </Button>
                        </>
                      )}
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="premium-input rounded-full"
                      >
                        <option value="">All users</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="blocked">Blocked</option>
                        <option value="suspended">Suspended</option>
                        <option value="admin">Admins</option>
                        <option value="google">Google users</option>
                        <option value="email">Email users</option>
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                      <thead className="bg-primary/5 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                        <tr>
                          <th className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={toggleSelectAllVisible}
                              aria-label="Select all visible users"
                            />
                          </th>
                          <th className="px-5 py-4">User</th>
                          <th className="px-5 py-4">Provider</th>
                          <th className="px-5 py-4">Role</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Reports</th>
                          <th className="px-5 py-4">Last Login</th>
                          <th className="px-5 py-4">IP / Device</th>
                          <th className="px-5 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUsers.map((user) => (
                          <tr key={user.id} className="border-t border-primary/8">
                            <td className="px-5 py-4">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                aria-label={`Select ${user.email ?? user.id}`}
                              />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="grid size-10 place-items-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary">
                                  {user.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatar_url} alt="" className="size-full object-cover" />
                                  ) : (
                                    (user.email ?? "U").charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold">{user.full_name ?? user.display_name ?? "Unnamed user"}</p>
                                  <p className="text-xs font-semibold text-foreground/45">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-semibold">{user.provider ?? "unknown"}</td>
                            <td className="px-5 py-4 font-semibold">{user.role}</td>
                            <td className="px-5 py-4"><StatusBadge status={user.approval_status} /></td>
                            <td className="px-5 py-4 font-semibold">{user.reports_generated}</td>
                            <td className="px-5 py-4 text-foreground/60">
                              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                            </td>
                            <td className="px-5 py-4 text-xs text-foreground/52">
                              <p>{user.last_ip ?? "No IP"}</p>
                              <p className="max-w-48 truncate">{user.device ?? user.browser ?? "Unknown device"}</p>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Button size="xs" variant="outline" onClick={() => updateUsers([user.id], "approve")}>
                                  <CheckCircle2 className="size-3" /> Approve
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => updateUsers([user.id], "reject")}>
                                  <XCircle className="size-3" /> Reject
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => updateUsers([user.id], user.approval_status === "blocked" ? "unblock" : "block")}>
                                  <CircleSlash className="size-3" /> {user.approval_status === "blocked" ? "Unblock" : "Block"}
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => updateUsers([user.id], user.role === "admin" ? "remove_admin" : "promote_admin")}>
                                  {user.role === "admin" ? "Remove admin" : "Promote"}
                                </Button>
                                <Button size="xs" variant="ghost" onClick={() => resetUserData(user.id)}>Reset data</Button>
                                <Button size="xs" variant="ghost" onClick={() => deleteUser(user.id)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {tab === "questions" && (
                <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="premium-card p-6">
                    <p className="text-label">Questionnaire Builder</p>
                    <h2 className="font-display text-3xl font-semibold">Create question</h2>
                    <p className="mt-3 text-sm font-medium leading-7 text-foreground/60">
                      Manage question text, options, categories, visibility,
                      order, conditions, and validation from the admin API.
                    </p>
                    <Button
                      className="btn-cta mt-6"
                      onClick={async () => {
                        await fetch("/api/admin/questions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text: "New relationship question",
                            type: "single_choice",
                            options: [
                              { label: "Option A", value: "a" },
                              { label: "Option B", value: "b" },
                            ],
                            sort_order: questions.length + 1,
                          }),
                        });
                        await loadAll();
                      }}
                    >
                      Add Question
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <div key={question.id} className="premium-card p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-label">{question.type} · {question.category ?? "General"}</p>
                            <h3 className="mt-2 font-display text-xl font-semibold">{question.text}</h3>
                            <p className="mt-2 text-sm font-medium text-foreground/55">
                              {question.enabled ? "Enabled" : "Disabled"} · {question.required ? "Required" : "Optional"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await fetch("/api/admin/questions", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: question.id, enabled: !question.enabled }),
                              });
                              await loadAll();
                            }}
                          >
                            {question.enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {tab === "adaptive" && (
                <section className="space-y-5">
                  <div className="premium-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-label">Adaptive Engine</p>
                      <h2 className="font-display text-3xl font-semibold">Dynamic questions</h2>
                      <p className="mt-2 text-sm font-medium text-foreground/55">
                        Manage the adaptive `questions` table used by the live assessment engine.
                      </p>
                    </div>
                    <select
                      value={adaptivePathFilter}
                      onChange={(e) => setAdaptivePathFilter(e.target.value)}
                      className="premium-input rounded-full"
                    >
                      <option value="">All paths</option>
                      <option value="do_i_love_someone">Do I love someone</option>
                      <option value="does_someone_love_me">Does someone love me</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    {visibleAdaptiveQuestions.map((question) => (
                      <div key={question.id} className="premium-card p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-label">
                              {question.path} · {question.psychological_dimension} · priority {question.priority}
                              {question.is_starter ? " · starter" : ""}
                              {question.is_clarification ? " · clarification" : ""}
                            </p>
                            <h3 className="mt-2 font-display text-xl font-semibold">{question.question_text}</h3>
                            <p className="mt-2 text-sm font-medium text-foreground/55">
                              {question.type} · {question.category}
                              {question.parent_question_id ? ` · parent: ${question.parent_question_id}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAdaptiveQuestion(question.id, !question.is_active)}
                            >
                              {question.is_active ? "Disable" : "Enable"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {visibleAdaptiveQuestions.length === 0 && (
                      <p className="premium-card p-6 text-sm font-semibold text-foreground/58">
                        No adaptive questions found. Run migration 003 to seed the question bank.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {tab === "reports" && (
                <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-5">
                    <div className="premium-card overflow-hidden">
                      <div className="border-b border-primary/10 p-5">
                        <p className="text-label">Generated Reports</p>
                        <h2 className="font-display text-3xl font-semibold">{reportRows.length} reports</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-sm">
                          <thead className="bg-primary/5 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                            <tr>
                              <th className="px-5 py-4">User</th>
                              <th className="px-5 py-4">Path</th>
                              <th className="px-5 py-4">Confidence</th>
                              <th className="px-5 py-4">Created</th>
                              <th className="px-5 py-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportRows.map((report) => (
                              <tr key={report.id} className="border-t border-primary/8">
                                <td className="px-5 py-4">
                                  <p className="font-bold">{report.user_name ?? "Unnamed"}</p>
                                  <p className="text-xs text-foreground/45">{report.user_email}</p>
                                </td>
                                <td className="px-5 py-4 font-semibold">{report.path}</td>
                                <td className="px-5 py-4">{report.confidence}</td>
                                <td className="px-5 py-4 text-foreground/60">
                                  {new Date(report.created_at).toLocaleString()}
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex gap-2">
                                    <Button size="xs" variant="outline" onClick={() => setSelectedReport(report)}>
                                      View
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      onClick={() => deleteReportOrSession("report", report.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="premium-card overflow-hidden">
                      <div className="border-b border-primary/10 p-5">
                        <p className="text-label">Assessment Sessions</p>
                        <h2 className="font-display text-3xl font-semibold">{sessionRows.length} sessions</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                          <thead className="bg-primary/5 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                            <tr>
                              <th className="px-5 py-4">User</th>
                              <th className="px-5 py-4">Path</th>
                              <th className="px-5 py-4">Status</th>
                              <th className="px-5 py-4">Questions</th>
                              <th className="px-5 py-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionRows.map((session) => (
                              <tr key={session.id} className="border-t border-primary/8">
                                <td className="px-5 py-4">{session.user_email ?? session.user_id}</td>
                                <td className="px-5 py-4 font-semibold">{session.path}</td>
                                <td className="px-5 py-4"><StatusBadge status={session.status} /></td>
                                <td className="px-5 py-4">{session.question_count}</td>
                                <td className="px-5 py-4">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => deleteReportOrSession("session", session.id)}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-6">
                    <p className="text-label">Report Detail</p>
                    {selectedReport ? (
                      <div className="mt-4 space-y-3 text-sm">
                        <h3 className="font-display text-2xl font-semibold">{selectedReport.title}</h3>
                        <p><span className="font-bold">User:</span> {selectedReport.user_email}</p>
                        <p><span className="font-bold">Path:</span> {selectedReport.path}</p>
                        <p><span className="font-bold">Confidence:</span> {selectedReport.confidence}</p>
                        <p><span className="font-bold">Session:</span> {selectedReport.assessment_session_id ?? "—"}</p>
                        <p><span className="font-bold">Created:</span> {new Date(selectedReport.created_at).toLocaleString()}</p>
                        <Button
                          className="mt-4"
                          variant="outline"
                          onClick={() => deleteReportOrSession("report", selectedReport.id)}
                        >
                          Delete report
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm font-medium text-foreground/55">
                        Select a report to view details.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {tab === "settings" && (
                <section className="grid gap-5 lg:grid-cols-2">
                  {["general", "maintenance", "theme"].map((key) => (
                    <div key={key} className="premium-card p-6">
                      <p className="text-label">{key}</p>
                      <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-black/5 p-4 text-xs dark:bg-white/[0.045]">
                        {JSON.stringify(settings[key] ?? {}, null, 2)}
                      </pre>
                      {key === "maintenance" && (
                        <Button className="mt-5" variant="outline" onClick={toggleMaintenance}>
                          {settings.maintenance?.enabled ? "Disable" : "Enable"} Maintenance
                        </Button>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {tab === "content" && (
                <section className="premium-card p-6">
                  <p className="text-label">Content Management</p>
                  <h2 className="font-display text-3xl font-semibold">Editable blocks</h2>
                  <p className="text-lead mt-3">
                    Homepage hero, testimonials, FAQs, policies, pricing,
                    report messages, recommendations, quotes, and footer content
                    are supported through the content API.
                  </p>
                </section>
              )}

              {tab === "music" && (
                <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="premium-card p-6">
                    <p className="text-label">Music Management</p>
                    <h2 className="font-display text-3xl font-semibold">
                      {music.settings?.enabled ? "Enabled" : "Disabled"}
                    </h2>
                    <Button className="mt-6" onClick={toggleMusic}>
                      {music.settings?.enabled ? "Disable" : "Enable"} Music
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {music.tracks.map((track) => (
                      <div key={track.id} className="premium-card flex items-center justify-between p-5">
                        <div>
                          <h3 className="font-display text-xl font-semibold">{track.title}</h3>
                          <p className="text-sm font-medium text-foreground/55">{track.artist ?? "Unknown artist"}</p>
                        </div>
                        <Button size="sm" variant="outline">Preview</Button>
                      </div>
                    ))}
                    {music.tracks.length === 0 && (
                      <p className="premium-card p-6 text-sm font-semibold text-foreground/58">
                        No tracks added yet. Add tracks through `/api/admin/music`
                        or connect Supabase Storage for uploads.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {tab === "audit" && (
                <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="premium-card p-6">
                    <p className="text-label">Audit Logs</p>
                    <div className="mt-5 space-y-3">
                      {audit.logs.map((log) => (
                        <div key={log.id} className="rounded-2xl border border-primary/10 bg-white/35 p-4 text-sm dark:bg-white/[0.04]">
                          <p className="font-bold">{log.action}</p>
                          <p className="text-xs text-foreground/48">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="premium-card p-6">
                    <p className="text-label">Notifications</p>
                    <div className="mt-5 space-y-3">
                      {audit.notifications.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-primary/10 bg-primary/7 p-4 text-sm">
                          <p className="font-bold">{item.title}</p>
                          <p className="mt-1 text-foreground/60">{item.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
