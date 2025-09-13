"use client"

import { useEffect, useState } from "react"
import {
  Users,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Download,
  Plus,
  Edit2,
  Trash2,
  Ban,
  UserX,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navigation } from "@/components/Navigation"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

interface Feedback {
  id: string
  user_id: string
  course_id: string
  rating: number
  message: string
  created_at: string
  user_name?: string
  user_email?: string
  profile_picture_url?: string
  course_name?: string
  course_code?: string
}

interface Course {
  id: string
  name: string
  code: string
  description: string
  is_active: boolean
  created_at: string
}

interface Student {
  id: string
  user_id: string
  name: string
  email: string
  profile_picture_url?: string
  phone?: string
  date_of_birth?: string
  address?: string
  is_blocked: boolean
  created_at: string
}

interface StudentDetails {
  id: string
  user_id: string
  name: string
  email: string
  profile_picture_url?: string
  phone?: string
  date_of_birth?: string
  address?: string
  is_blocked: boolean
  created_at: string
  feedback_count: number
  average_rating: number
  recent_feedbacks: Feedback[]
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeedbacks: 0,
    totalCourses: 0,
    averageRating: 0,
  })

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)

  // Filters
  const [feedbackFilter, setFeedbackFilter] = useState({
    course: "all",
    rating: "all",
    search: "",
  })

  const [studentFilter, setStudentFilter] = useState({
    search: "",
    status: "all",
  })

  // Course form
  const [courseForm, setCourseForm] = useState({
    id: "",
    name: "",
    code: "",
    description: "",
    is_active: true,
  })
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [showCourseDialog, setShowCourseDialog] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      // Get student count
      const { count: studentCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")

      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })

      const { data: profilesData } = await supabase.from("profiles").select(`
          user_id, 
          name, 
          email,
          profile_picture_url,
          phone,
          date_of_birth,
          address,
          is_blocked,
          created_at
        `)

      const { data: usersData } = await supabase.auth.admin.listUsers()

      const { data: coursesData } = await supabase.from("courses").select("*").order("name")

      const feedbackWithDetails =
        feedbackData?.map((feedback) => {
          const profile = profilesData?.find((p) => p.user_id === feedback.user_id)
          const user = (usersData?.users as any)?.find((u: any) => u.id === feedback.user_id)
          const course = (coursesData as any)?.find((c: any) => c.id === feedback.course_id)
          return {
            ...feedback,
            user_name: profile?.name || "Unknown",
            user_email: user?.email || "Unknown",
            profile_picture_url: profile?.profile_picture_url,
            course_name: course?.name || "Unknown",
            course_code: course?.code || "Unknown",
          }
        }) || []

      const studentsWithDetails =
        profilesData?.map((profile) => {
          return {
            ...profile,
            id: profile.user_id,
            email: profile.email || "No email found",
          }
        }) || []

      const totalFeedbacks = feedbackWithDetails?.length || 0
      const averageRating =
        totalFeedbacks > 0 ? feedbackWithDetails.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks : 0

      setStats({
        totalStudents: studentCount || 0,
        totalFeedbacks,
        totalCourses: coursesData?.length || 0,
        averageRating: Math.round(averageRating * 10) / 10,
      })

      setFeedbacks(feedbackWithDetails || [])
      setCourses(coursesData || [])
      setStudents(studentsWithDetails || [])

      // Generate chart data
      if (coursesData && feedbackWithDetails) {
        const courseRatings = coursesData.map((course) => {
          const courseFeedbacks = feedbackWithDetails.filter((f) => f.course_id === course.id)
          const avgRating =
            courseFeedbacks.length > 0
              ? courseFeedbacks.reduce((sum, f) => sum + f.rating, 0) / courseFeedbacks.length
              : 0
          return {
            name: course.code,
            rating: Math.round(avgRating * 10) / 10,
            count: courseFeedbacks.length,
          }
        })
        setChartData(courseRatings)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      })
    }
  }

  const fetchStudentDetails = async (studentId: string) => {
    try {
      const student = students.find((s) => s.user_id === studentId)
      if (!student) return

      const studentFeedbacks = feedbacks.filter((f) => f.user_id === studentId)
      const averageRating =
        studentFeedbacks.length > 0
          ? studentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / studentFeedbacks.length
          : 0

      const studentDetails: StudentDetails = {
        ...student,
        feedback_count: studentFeedbacks.length,
        average_rating: Math.round(averageRating * 10) / 10,
        recent_feedbacks: studentFeedbacks.slice(0, 5),
      }

      setSelectedStudent(studentDetails)
      setShowStudentDetails(true)
    } catch (error) {
      console.error("Error fetching student details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch student details",
        variant: "destructive",
      })
    }
  }

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (feedbackFilter.course && feedbackFilter.course !== "all" && feedback.course_id !== feedbackFilter.course)
      return false
    if (
      feedbackFilter.rating &&
      feedbackFilter.rating !== "all" &&
      feedback.rating.toString() !== feedbackFilter.rating
    )
      return false
    if (feedbackFilter.search) {
      const searchLower = feedbackFilter.search.toLowerCase()
      return (
        feedback.user_name?.toLowerCase().includes(searchLower) ||
        feedback.user_email?.toLowerCase().includes(searchLower) ||
        feedback.course_name?.toLowerCase().includes(searchLower) ||
        feedback.message.toLowerCase().includes(searchLower) ||
        false
      )
    }
    return true
  })

  const filteredStudents = students.filter((student) => {
    if (studentFilter.status !== "all") {
      if (studentFilter.status === "blocked" && !student.is_blocked) return false
      if (studentFilter.status === "active" && student.is_blocked) return false
    }
    if (studentFilter.search) {
      const searchLower = studentFilter.search.toLowerCase()
      return (
        student.name?.toLowerCase().includes(searchLower) || student.email?.toLowerCase().includes(searchLower) || false
      )
    }
    return true
  })

  const exportToCSV = () => {
    const headers = ["Student Name", "Student Email", "Course", "Rating", "Message", "Date"]
    const csvData = filteredFeedbacks.map((feedback) => [
      feedback.user_name || "Unknown",
      feedback.user_email || "Unknown",
      `${feedback.course_code} - ${feedback.course_name}`,
      feedback.rating,
      `"${feedback.message.replace(/"/g, '""')}"`,
      new Date(feedback.created_at).toLocaleDateString(),
    ])

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `feedback-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSaveCourse = async () => {
    try {
      if (isEditingCourse) {
        const { error } = await supabase
          .from("courses")
          .update({
            name: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            is_active: courseForm.is_active,
          })
          .eq("id", courseForm.id)

        if (error) throw error
        toast({ title: "Success", description: "Course updated successfully" })
      } else {
        const { error } = await supabase.from("courses").insert([
          {
            name: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            is_active: courseForm.is_active,
          },
        ])

        if (error) throw error
        toast({ title: "Success", description: "Course created successfully" })
      }

      setShowCourseDialog(false)
      setCourseForm({ id: "", name: "", code: "", description: "", is_active: true })
      setIsEditingCourse(false)
      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error
      toast({ title: "Success", description: "Course deleted successfully" })
      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleToggleStudentBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_blocked: !isBlocked }).eq("user_id", userId)

      if (error) throw error
      toast({
        title: "Success",
        description: `Student ${!isBlocked ? "blocked" : "unblocked"} successfully`,
      })
      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      })

      if (error) throw error

      toast({ title: "Success", description: "Student deleted successfully" })
      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-300">Comprehensive feedback and student management system</p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Students</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalStudents}</div>
              <p className="text-xs text-slate-400">Active learners</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Feedback</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalFeedbacks}</div>
              <p className="text-xs text-slate-400">Student responses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Courses</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalCourses}</div>
              <p className="text-xs text-slate-400">Available courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Average Rating</CardTitle>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.averageRating}</div>
              <p className="text-xs text-slate-400">Overall satisfaction</p>
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
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="feedback" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Feedback Management
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Course Management
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Student Management
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Feedback Management */}
          <TabsContent value="feedback">
            <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">All Feedback</CardTitle>
                    <CardDescription className="text-slate-300">
                      View and filter all student feedback with profile information
                    </CardDescription>
                  </div>
                  <Button
                    onClick={exportToCSV}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Enhanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search" className="text-slate-200">
                      Search
                    </Label>
                    <Input
                      id="search"
                      placeholder="Search by name, email, course..."
                      value={feedbackFilter.search}
                      onChange={(e) => setFeedbackFilter({ ...feedbackFilter, search: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="course-filter">Course</Label>
                    <Select
                      value={feedbackFilter.course}
                      onValueChange={(value) => setFeedbackFilter({ ...feedbackFilter, course: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rating-filter">Rating</Label>
                    <Select
                      value={feedbackFilter.rating}
                      onValueChange={(value) => setFeedbackFilter({ ...feedbackFilter, rating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ratings</SelectItem>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating} Star{rating > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setFeedbackFilter({ course: "all", rating: "all", search: "" })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Enhanced Feedback Table */}
                <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-200">Student</TableHead>
                        <TableHead className="text-slate-200">Course</TableHead>
                        <TableHead className="text-slate-200">Rating</TableHead>
                        <TableHead className="text-slate-200">Message</TableHead>
                        <TableHead className="text-slate-200">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeedbacks.map((feedback) => (
                        <TableRow key={feedback.id} className="border-slate-700/50 hover:bg-slate-800/30">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={feedback.profile_picture_url || "/placeholder.svg"}
                                  alt={feedback.user_name}
                                />
                                <AvatarFallback className="bg-purple-600 text-white text-xs">
                                  {feedback.user_name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-white">{feedback.user_name}</div>
                                <div className="text-xs text-slate-400">{feedback.user_email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-200">
                            <div>
                              <div className="font-medium">{feedback.course_code}</div>
                              <div className="text-xs text-slate-400">{feedback.course_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                feedback.rating >= 4 ? "default" : feedback.rating >= 3 ? "secondary" : "destructive"
                              }
                              className={
                                feedback.rating >= 4 
                                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                  : feedback.rating >= 3 
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                                  : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                              }
                            >
                              {feedback.rating} ⭐
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-slate-200" title={feedback.message}>
                              {feedback.message}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </TableCell>
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
                          setCourseForm({ id: "", name: "", code: "", description: "", is_active: true })
                          setIsEditingCourse(false)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{isEditingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
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
                            {isEditingCourse ? "Update" : "Create"}
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
                                  setCourseForm(course)
                                  setIsEditingCourse(true)
                                  setShowCourseDialog(true)
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

          {/* Enhanced Student Management */}
          <TabsContent value="students">
            <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Student Management</CardTitle>
                    <CardDescription className="text-slate-300">
                      View and manage student accounts with detailed profiles
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="student-search" className="text-slate-200">
                      Search Students
                    </Label>
                    <Input
                      id="student-search"
                      placeholder="Search by name or email..."
                      value={studentFilter.search}
                      onChange={(e) => setStudentFilter({ ...studentFilter, search: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-status" className="text-slate-200">
                      Status
                    </Label>
                    <Select
                      value={studentFilter.status}
                      onValueChange={(value) => setStudentFilter({ ...studentFilter, status: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                        <SelectValue placeholder="All students" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="blocked">Blocked Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setStudentFilter({ search: "", status: "all" })}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Enhanced Student Table */}
                <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-200">Student</TableHead>
                        <TableHead className="text-slate-200">Contact</TableHead>
                        <TableHead className="text-slate-200">Status</TableHead>
                        <TableHead className="text-slate-200">Joined</TableHead>
                        <TableHead className="text-slate-200">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} className="border-slate-700/50 hover:bg-slate-800/30">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={student.profile_picture_url || "/placeholder.svg"}
                                  alt={student.name}
                                />
                                <AvatarFallback className="bg-purple-600 text-white">
                                  {student.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-white">{student.name || "Unnamed Student"}</div>
                                <div className="text-xs text-slate-400">{student.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-slate-200 text-sm">
                              {student.phone || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.is_blocked ? "destructive" : "default"}>
                              {student.is_blocked ? "Blocked" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(student.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchStudentDetails(student.user_id)}
                                className="border-slate-600 text-slate-200 hover:bg-slate-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStudentBlock(student.user_id, student.is_blocked)}
                                className="border-slate-600 text-slate-200 hover:bg-slate-700"
                              >
                                {student.is_blocked ? <Users className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-800 border-slate-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Delete Student</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-300">
                                      Are you sure you want to delete this student account? This action cannot be undone
                                      and will remove all their data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStudent(student.user_id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
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

        <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                {/* Student Profile Section */}
                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedStudent.profile_picture_url || "/placeholder.svg"}
                      alt={selectedStudent.name}
                    />
                    <AvatarFallback className="bg-purple-600 text-white text-lg">
                      {selectedStudent.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{selectedStudent.name}</h3>
                    <div className="space-y-1 text-sm text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{selectedStudent.email}</span>
                      </div>
                      {selectedStudent.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedStudent.phone}</span>
                        </div>
                      )}
                      {selectedStudent.date_of_birth && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(selectedStudent.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedStudent.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedStudent.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={selectedStudent.is_blocked ? "destructive" : "default"}>
                      {selectedStudent.is_blocked ? "Blocked" : "Active"}
                    </Badge>
                    <div className="text-xs text-slate-400 mt-1">
                      Joined {new Date(selectedStudent.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{selectedStudent.feedback_count}</div>
                      <div className="text-sm text-slate-400">Total Feedback</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{selectedStudent.average_rating}</div>
                      <div className="text-sm text-slate-400">Average Rating</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Feedback */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Recent Feedback</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedStudent.recent_feedbacks.map((feedback) => (
                      <div key={feedback.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-white">
                            {feedback.course_code} - {feedback.course_name}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={
                              feedback.rating >= 4 
                                ? "bg-green-500/20 text-green-400"
                                : feedback.rating >= 3 
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }
                          >
                            {feedback.rating} ⭐
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300">{feedback.message}</p>
                        <div className="text-xs text-slate-400 mt-2">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {selectedStudent.recent_feedbacks.length === 0 && (
                      <div className="text-center text-slate-400 py-4">No feedback submitted yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
