"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Star, Plus, Edit, Trash2, Send, MessageSquare, BookOpen, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation } from "@/components/Navigation"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface Course {
  id: string
  name: string
  code: string
}

interface FeedbackItem {
  id: string
  rating: number
  message: string
  created_at: string
  courses?: Course
}

export default function Feedback() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState("all")

  // Form state
  const [selectedCourse, setSelectedCourse] = useState("")
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchCourses()
    fetchFeedbacks()
  }, [user])

  useEffect(() => {
    filterFeedbacks()
  }, [feedbacks, searchTerm, filterRating])

  const filterFeedbacks = () => {
    let filtered = feedbacks

    if (searchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          feedback.courses?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.courses?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.message.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterRating !== "all") {
      filtered = filtered.filter((feedback) => feedback.rating === Number.parseInt(filterRating))
    }

    setFilteredFeedbacks(filtered)
  }

  const fetchCourses = async () => {
    try {
      const { data } = await supabase.from("courses").select("id, name, code").eq("is_active", true).order("name")

      if (data) {
        setCourses(data)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchFeedbacks = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from("feedback")
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setFeedbacks(data as FeedbackItem[])
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    }
  }

  const resetForm = () => {
    setSelectedCourse("")
    setRating(0)
    setMessage("")
    setEditingFeedback(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCourse || !rating || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (editingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from("feedback")
          .update({
            course_id: selectedCourse,
            rating,
            message: message.trim(),
          })
          .eq("id", editingFeedback.id)

        if (error) throw error

        toast({
          title: "Success!",
          description: "Feedback updated successfully",
        })
      } else {
        // Create new feedback
        const { error } = await supabase.from("feedback").insert({
          user_id: user?.id,
          course_id: selectedCourse,
          rating,
          message: message.trim(),
        })

        if (error) throw error

        toast({
          title: "Success!",
          description: "Feedback submitted successfully",
        })
      }

      resetForm()
      setIsDialogOpen(false)
      fetchFeedbacks()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (feedback: FeedbackItem) => {
    setEditingFeedback(feedback)
    setSelectedCourse(feedback.courses?.id || "")
    setRating(feedback.rating)
    setMessage(feedback.message)
    setIsDialogOpen(true)
  }

  const handleDelete = async (feedbackId: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return

    try {
      const { error } = await supabase.from("feedback").delete().eq("id", feedbackId)

      if (error) throw error

      toast({
        title: "Success!",
        description: "Feedback deleted successfully",
      })

      fetchFeedbacks()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete feedback",
        variant: "destructive",
      })
    }
  }

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-all duration-200 ${
              star <= currentRating
                ? "text-yellow-400 fill-current drop-shadow-sm scale-110"
                : "text-muted-foreground/40 hover:text-yellow-300 hover:scale-105"
            }`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/3">
      <Navigation />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-10 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-60"></div>
                <div className="relative p-3 bg-gradient-primary rounded-2xl shadow-strong">
                  <MessageSquare className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">Course Feedback</h1>
                <p className="text-muted-foreground text-lg">Submit and manage your course evaluations</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="btn-gradient px-6 py-3 h-auto"
                  onClick={() => {
                    resetForm()
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] glass-card">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {editingFeedback ? "Edit Feedback" : "Submit Course Feedback"}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {editingFeedback
                      ? "Update your course evaluation below."
                      : "Share your thoughts about the course to help improve the learning experience."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="space-y-3">
                    <Label htmlFor="course" className="text-sm font-semibold">
                      Course
                    </Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="h-12 premium-input">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id} className="hover:bg-muted/50">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4" />
                              <span>
                                {course.name} ({course.code})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Rating</Label>
                    <div className="flex justify-center py-2">{renderStars(rating, true)}</div>
                    <p className="text-xs text-center text-muted-foreground">
                      Click on stars to rate (1 = Poor, 5 = Excellent)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="message" className="text-sm font-semibold">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Share your detailed feedback about the course..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="premium-input resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="btn-gradient px-6">
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {editingFeedback ? "Update" : "Submit"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="w-40 h-1.5 bg-gradient-primary rounded-full shadow-glow"></div>
        </div>

        <Card className="card-elevated glass-card mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback by course name, code, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 premium-input"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="h-12 premium-input">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {filteredFeedbacks.length > 0 ? (
            filteredFeedbacks.map((feedback, index) => (
              <Card
                key={feedback.id}
                className="card-elevated glass-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-foreground">
                          {feedback.courses?.name || "Unknown Course"}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {feedback.courses?.code || "N/A"} •{" "}
                          {new Date(feedback.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(feedback)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(feedback.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= feedback.rating ? "text-yellow-400 fill-current" : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed text-base bg-muted/20 p-4 rounded-lg border border-border/30">
                    {feedback.message}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated glass-card">
              <CardContent className="text-center py-16">
                <div className="mb-6">
                  <div className="relative mx-auto w-20 h-20 mb-4">
                    <div className="absolute inset-0 bg-muted/20 rounded-full"></div>
                    <div className="relative flex items-center justify-center w-20 h-20">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg mb-4 font-medium">
                  {searchTerm || filterRating !== "all"
                    ? "No feedback matches your search"
                    : "No feedback submitted yet"}
                </p>
                <p className="text-muted-foreground/80 mb-6">
                  {searchTerm || filterRating !== "all"
                    ? "Try adjusting your search terms or filters"
                    : "Start evaluating your courses to see your feedback history here."}
                </p>
                <Button
                  className="btn-gradient"
                  onClick={() => {
                    resetForm()
                    setIsDialogOpen(true)
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
  )
}
