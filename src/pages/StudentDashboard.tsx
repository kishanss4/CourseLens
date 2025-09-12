import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, MessageSquare, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    coursesRated: 0,
  });
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user's feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (feedbackData) {
        // Calculate stats
        const totalFeedbacks = feedbackData.length;
        const averageRating = totalFeedbacks > 0 
          ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
          : 0;
        const coursesRated = new Set(feedbackData.map(f => f.courses?.name)).size;

        setStats({
          totalFeedbacks,
          averageRating: Math.round(averageRating * 10) / 10,
          coursesRated,
        });

        // Set recent feedback (last 5)
        setRecentFeedback(feedbackData.slice(0, 5));

        // Calculate rating distribution
        const distribution = [1, 2, 3, 4, 5].map(rating => ({
          rating: `${rating} Star${rating > 1 ? 's' : ''}`,
          count: feedbackData.filter(f => f.rating === rating).length,
        }));
        setRatingDistribution(distribution);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your course feedback and engagement</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback Submitted</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalFeedbacks}</div>
              <p className="text-xs text-muted-foreground">Course evaluations completed</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating Given</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.averageRating}</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= stats.averageRating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Evaluated</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.coursesRated}</div>
              <p className="text-xs text-muted-foreground">Unique courses rated</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution Chart */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Rating Distribution
              </CardTitle>
              <CardDescription>
                How you rate courses across different star levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Feedback
              </CardTitle>
              <CardDescription>
                Your latest course evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFeedback.length > 0 ? (
                  recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {feedback.courses?.name || 'Unknown Course'} ({feedback.courses?.code || 'N/A'})
                        </h4>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= feedback.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No feedback submitted yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}