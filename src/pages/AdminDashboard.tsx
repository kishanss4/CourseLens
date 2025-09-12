import { useEffect, useState } from 'react';
import { Users, MessageSquare, BookOpen, TrendingUp, Download, Plus, Edit2, Trash2, Filter, Search, Ban, UserX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Feedback {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  message: string;
  created_at: string;
  user_name?: string;
  course_name?: string;
  course_code?: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface Student {
  id: string;
  user_id: string;
  name: string;
  is_blocked: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeedbacks: 0,
    totalCourses: 0,
    averageRating: 0,
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Filters
  const [feedbackFilter, setFeedbackFilter] = useState({
    course: 'all',
    rating: 'all',
    search: ''
  });

  // Course form
  const [courseForm, setCourseForm] = useState({
    id: '',
    name: '',
    code: '',
    description: '',
    is_active: true
  });
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Get student count
      const { count: studentCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Get feedback with user and course details using manual joins
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      // Get user names and course details separately
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name');

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      // Manually join the data
      const feedbackWithDetails = feedbackData?.map(feedback => {
        const profile = profilesData?.find(p => p.user_id === feedback.user_id);
        const course = coursesData?.find(c => c.id === feedback.course_id);
        return {
          ...feedback,
          user_name: profile?.name || 'Unknown',
          course_name: course?.name || 'Unknown',
          course_code: course?.code || 'Unknown'
        };
      }) || [];

      // Get students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          is_blocked,
          created_at
        `)
        .order('created_at', { ascending: false });

      const totalFeedbacks = feedbackWithDetails?.length || 0;
      const averageRating = totalFeedbacks > 0 
        ? feedbackWithDetails.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
        : 0;

      setStats({
        totalStudents: studentCount || 0,
        totalFeedbacks,
        totalCourses: coursesData?.length || 0,
        averageRating: Math.round(averageRating * 10) / 10,
      });

      setFeedbacks(feedbackWithDetails || []);
      setCourses(coursesData || []);
      setStudents(studentsData || []);

      // Generate chart data
      if (coursesData && feedbackWithDetails) {
        const courseRatings = coursesData.map(course => {
          const courseFeedbacks = feedbackWithDetails.filter(f => f.course_id === course.id);
          const avgRating = courseFeedbacks.length > 0 
            ? courseFeedbacks.reduce((sum, f) => sum + f.rating, 0) / courseFeedbacks.length 
            : 0;
          return {
            name: course.code,
            rating: Math.round(avgRating * 10) / 10,
            count: courseFeedbacks.length
          };
        });
        setChartData(courseRatings);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (feedbackFilter.course && feedbackFilter.course !== 'all' && feedback.course_id !== feedbackFilter.course) return false;
    if (feedbackFilter.rating && feedbackFilter.rating !== 'all' && feedback.rating.toString() !== feedbackFilter.rating) return false;
    if (feedbackFilter.search) {
      const searchLower = feedbackFilter.search.toLowerCase();
      return (feedback.user_name?.toLowerCase().includes(searchLower) ||
             feedback.course_name?.toLowerCase().includes(searchLower) ||
             feedback.message.toLowerCase().includes(searchLower)) || false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Student Name', 'Course', 'Rating', 'Message', 'Date'];
    const csvData = filteredFeedbacks.map(feedback => [
      feedback.user_name || 'Unknown',
      `${feedback.course_code} - ${feedback.course_name}`,
      feedback.rating,
      `"${feedback.message.replace(/"/g, '""')}"`,
      new Date(feedback.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveCourse = async () => {
    try {
      if (isEditingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({
            name: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            is_active: courseForm.is_active
          })
          .eq('id', courseForm.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Course updated successfully" });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([{
            name: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            is_active: courseForm.is_active
          }]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Course created successfully" });
      }
      
      setShowCourseDialog(false);
      setCourseForm({ id: '', name: '', code: '', description: '', is_active: true });
      setIsEditingCourse(false);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
      toast({ title: "Success", description: "Course deleted successfully" });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStudentBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isBlocked })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Student ${!isBlocked ? 'blocked' : 'unblocked'} successfully` 
      });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      toast({ title: "Success", description: "Student deleted successfully" });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive system overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalFeedbacks}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.averageRating}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Course Ratings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="rating" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Feedback Count by Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
            <TabsTrigger value="courses">Course Management</TabsTrigger>
            <TabsTrigger value="students">Student Management</TabsTrigger>
          </TabsList>

          {/* Feedback Management */}
          <TabsContent value="feedback">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Feedback</CardTitle>
                    <CardDescription>View and filter all student feedback</CardDescription>
                  </div>
                  <Button onClick={exportToCSV} className="btn-gradient">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search feedback..."
                      value={feedbackFilter.search}
                      onChange={(e) => setFeedbackFilter({ ...feedbackFilter, search: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="course-filter">Course</Label>
                    <Select value={feedbackFilter.course} onValueChange={(value) => setFeedbackFilter({ ...feedbackFilter, course: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rating-filter">Rating</Label>
                    <Select value={feedbackFilter.rating} onValueChange={(value) => setFeedbackFilter({ ...feedbackFilter, rating: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ratings</SelectItem>
                        {[1, 2, 3, 4, 5].map(rating => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating} Star{rating > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setFeedbackFilter({ course: 'all', rating: 'all', search: '' })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Feedback Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeedbacks.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell className="font-medium">{feedback.user_name}</TableCell>
                          <TableCell>{feedback.course_code} - {feedback.course_name}</TableCell>
                          <TableCell>
                            <Badge variant={feedback.rating >= 4 ? "default" : feedback.rating >= 3 ? "secondary" : "destructive"}>
                              {feedback.rating} ⭐
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{feedback.message}</TableCell>
                          <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Management */}
          <TabsContent value="courses">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Course Management</CardTitle>
                    <CardDescription>Add, edit, and manage courses</CardDescription>
                  </div>
                  <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="btn-gradient"
                        onClick={() => {
                          setCourseForm({ id: '', name: '', code: '', description: '', is_active: true });
                          setIsEditingCourse(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{isEditingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="course-name">Course Name</Label>
                          <Input
                            id="course-name"
                            value={courseForm.name}
                            onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                            placeholder="Introduction to Computer Science"
                          />
                        </div>
                        <div>
                          <Label htmlFor="course-code">Course Code</Label>
                          <Input
                            id="course-code"
                            value={courseForm.code}
                            onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                            placeholder="CS101"
                          />
                        </div>
                        <div>
                          <Label htmlFor="course-description">Description</Label>
                          <Input
                            id="course-description"
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                            placeholder="Course description..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveCourse} className="btn-gradient">
                            {isEditingCourse ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{course.description}</TableCell>
                          <TableCell>
                            <Badge variant={course.is_active ? "default" : "secondary"}>
                              {course.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCourseForm(course);
                                  setIsEditingCourse(true);
                                  setShowCourseDialog(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this course? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Management */}
          <TabsContent value="students">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>View and manage student accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <Badge variant={student.is_blocked ? "destructive" : "default"}>
                              {student.is_blocked ? "Blocked" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStudentBlock(student.user_id, student.is_blocked)}
                              >
                                {student.is_blocked ? (
                                  <>
                                    <Users className="h-4 w-4 mr-1" />
                                    Unblock
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    Block
                                  </>
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <UserX className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this student account? This action cannot be undone and will remove all their data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStudent(student.user_id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}