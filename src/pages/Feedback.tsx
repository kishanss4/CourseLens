import { useState, useEffect } from 'react';
import { Star, Plus, Edit, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface FeedbackItem {
  id: string;
  rating: number;
  message: string;
  created_at: string;
  courses?: Course;
}

export default function Feedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchFeedbacks();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchFeedbacks = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('feedback')
        .select(`
          id,
          rating,
          message,
          created_at,
          courses (
            id,
            name,
            code
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setFeedbacks(data as FeedbackItem[]);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const resetForm = () => {
    setSelectedCourse('');
    setRating(0);
    setMessage('');
    setEditingFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse || !rating || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('feedback')
          .update({
            course_id: selectedCourse,
            rating,
            message: message.trim(),
          })
          .eq('id', editingFeedback.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Feedback updated successfully",
        });
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('feedback')
          .insert({
            user_id: user?.id,
            course_id: selectedCourse,
            rating,
            message: message.trim(),
          });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Feedback submitted successfully",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchFeedbacks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feedback: FeedbackItem) => {
    setEditingFeedback(feedback);
    setSelectedCourse(feedback.courses?.id || '');
    setRating(feedback.rating);
    setMessage(feedback.message);
    setIsDialogOpen(true);
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Feedback deleted successfully",
      });
      
      fetchFeedbacks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete feedback",
        variant: "destructive",
      });
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer transition-colors ${
              star <= currentRating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Course Feedback</h1>
            <p className="text-muted-foreground">Submit and manage your course evaluations</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-gradient"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingFeedback ? 'Edit Feedback' : 'Submit Course Feedback'}
                </DialogTitle>
                <DialogDescription>
                  {editingFeedback 
                    ? 'Update your course evaluation below.'
                    : 'Share your thoughts about the course to help improve the learning experience.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  {renderStars(rating, true)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Share your detailed feedback about the course..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="btn-gradient">
                    {loading ? 'Submitting...' : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {editingFeedback ? 'Update' : 'Submit'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="card-elevated">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {feedback.courses?.name || 'Unknown Course'}
                      </CardTitle>
                      <CardDescription>
                        {feedback.courses?.code || 'N/A'} • {new Date(feedback.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(feedback)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(feedback.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    {renderStars(feedback.rating)}
                  </div>
                  <p className="text-foreground leading-relaxed">{feedback.message}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No feedback submitted yet</p>
                </div>
                <Button 
                  className="btn-gradient"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  Submit Your First Feedback
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}