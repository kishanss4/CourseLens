"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import {
  BookOpen,
  MessageSquare,
  TrendingUp,
  Star,
  Award,
  Calendar,
  Target,
  Activity,
  Zap,
  Trophy,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/Navigation"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    coursesRated: 0,
  })
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch user's feedback
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select(`
          id,
          rating,
          message,
          created_at,
          courses (
            name,
            code
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (feedbackData) {
        // Calculate stats
        const totalFeedbacks = feedbackData.length
        const averageRating =
          totalFeedbacks > 0 ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks : 0
        const coursesRated = new Set(feedbackData.map((f) => f.courses?.name)).size

        setStats({
          totalFeedbacks,
          averageRating: Math.round(averageRating * 10) / 10,
          coursesRated,
        })

        // Set recent feedback (last 5)
        setRecentFeedback(feedbackData.slice(0, 5))

        // Calculate rating distribution
        const distribution = [1, 2, 3, 4, 5].map((rating) => ({
          rating: `${rating} Star${rating > 1 ? "s" : ""}`,
          count: feedbackData.filter((f) => f.rating === rating).length,
          fill: rating <= 2 ? "#ef4444" : rating === 3 ? "#f59e0b" : "#10b981",
        }))
        setRatingDistribution(distribution)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  const pieChartData = ratingDistribution
    .filter((item) => item.count > 0)
    .map((item, index) => ({
      name: item.rating,
      value: item.count,
      fill: ["#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"][index] || "#10b981",
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/3">
      <Navigation />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-60"></div>
                <div className="relative p-3 bg-gradient-primary rounded-2xl shadow-strong">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gradient mb-2">Student Dashboard</h1>
                <p className="text-muted-foreground text-xl">Your course feedback journey and engagement insights</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-border/50">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Active Session</span>
            </div>
          </div>
          <div className="w-40 h-1.5 bg-gradient-primary rounded-full shadow-glow"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="card-elevated glass-card group hover:scale-105 transition-all duration-500 animate-fade-in-up border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Total Feedback
              </CardTitle>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                <div className="relative p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors border border-primary/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">{stats.totalFeedbacks}</div>
              <p className="text-sm text-muted-foreground flex items-center mb-4">
                <Award className="h-4 w-4 mr-2" />
                Course evaluations completed
              </p>
              <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-primary h-3 rounded-full transition-all duration-1000 shadow-glow"
                  style={{ width: `${Math.min(stats.totalFeedbacks * 10, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Progress</span>
                <span>{Math.min(stats.totalFeedbacks * 10, 100)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="card-elevated glass-card group hover:scale-105 transition-all duration-500 animate-fade-in-up border-l-4 border-l-accent"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Average Rating
              </CardTitle>
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                <div className="relative p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors border border-accent/20">
                  <Star className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent mb-2">{stats.averageRating}</div>
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 transition-all duration-300 ${
                      star <= stats.averageRating
                        ? "text-yellow-400 fill-current drop-shadow-sm"
                        : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Your satisfaction rating</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Quality</span>
                <div className="flex space-x-1">
                  {stats.averageRating >= 4 && <Trophy className="h-4 w-4 text-yellow-400" />}
                  {stats.averageRating >= 3.5 && <Zap className="h-4 w-4 text-accent" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="card-elevated glass-card group hover:scale-105 transition-all duration-500 animate-fade-in-up border-l-4 border-l-success"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Courses Evaluated
              </CardTitle>
              <div className="relative">
                <div className="absolute inset-0 bg-success/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                <div className="relative p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors border border-success/20">
                  <BookOpen className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success mb-2">{stats.coursesRated}</div>
              <p className="text-sm text-muted-foreground flex items-center mb-4">
                <Users className="h-4 w-4 mr-2" />
                Unique courses rated
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${stats.coursesRated > 0 ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
                  ></div>
                  <span className="text-sm font-medium text-success">
                    {stats.coursesRated > 0 ? "Active Learner" : "Getting Started"}
                  </span>
                </div>
                {stats.coursesRated >= 5 && <Activity className="h-5 w-5 text-success" />}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="card-elevated glass-card animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                Rating Distribution
              </CardTitle>
              <CardDescription className="text-base">How you rate courses across different star levels</CardDescription>
            </CardHeader>
            <CardContent className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={ratingDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="rating"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))",
                      boxShadow: "var(--shadow-medium)",
                      backdropFilter: "blur(16px)",
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} stroke="hsl(var(--primary))" strokeWidth={1}>
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated glass-card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground text-xl">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                Recent Feedback
              </CardTitle>
              <CardDescription className="text-base">Your latest course evaluations and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {recentFeedback.length > 0 ? (
                  recentFeedback.map((feedback, index) => (
                    <div
                      key={feedback.id}
                      className="relative p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl border border-border/50 backdrop-blur-sm hover:from-muted/30 hover:to-muted/20 transition-all duration-300 group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-primary rounded-full"></div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {feedback.courses?.name || "Unknown Course"}
                          </h4>
                          <p className="text-sm text-accent font-medium">{feedback.courses?.code || "N/A"}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-background/60 px-3 py-1.5 rounded-full border border-border/30">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= feedback.rating ? "text-yellow-400 fill-current" : "text-muted-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                        {feedback.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5" />
                          {new Date(feedback.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <div className="relative mx-auto w-16 h-16 mb-4">
                        <div className="absolute inset-0 bg-muted/20 rounded-full"></div>
                        <div className="relative flex items-center justify-center w-16 h-16">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-base mb-2 font-medium">No feedback submitted yet</p>
                    <p className="text-sm text-muted-foreground/80">
                      Start evaluating your courses to see your feedback history here.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {stats.totalFeedbacks > 0 && (
          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Card className="card-elevated glass-card border-gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground text-2xl">
                  <div className="p-3 bg-warning/10 rounded-xl">
                    <Award className="h-7 w-7 text-warning" />
                  </div>
                  Your Feedback Impact
                </CardTitle>
                <CardDescription className="text-base">
                  See how your feedback contributes to course improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-primary mb-2">{stats.totalFeedbacks}</div>
                    <p className="text-sm text-muted-foreground font-medium">Feedback Given</p>
                    <div className="mt-3 w-full bg-primary/20 rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-accent mb-2">{stats.coursesRated}</div>
                    <p className="text-sm text-muted-foreground font-medium">Courses Helped</p>
                    <div className="mt-3 w-full bg-accent/20 rounded-full h-2">
                      <div
                        className="bg-gradient-secondary h-2 rounded-full"
                        style={{ width: `${Math.min(stats.coursesRated * 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border border-success/20 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-success mb-2">{stats.averageRating}</div>
                    <p className="text-sm text-muted-foreground font-medium">Avg. Rating</p>
                    <div className="mt-3 w-full bg-success/20 rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{ width: `${(stats.averageRating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
