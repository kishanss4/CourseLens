import type React from "react"

import { useState } from "react"
import { Navigate } from "react-router-dom"
import { Eye, EyeOff, GraduationCap, Mail, Lock, User, UserCheck, Sparkles, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

export default function Auth() {
  const { user, signIn, signUp, role, loading } = useAuth() // include loading here
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form states
  const [signInData, setSignInData] = useState({ email: "", password: "" })
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "admin",
  })

  // Redirect based on role after login
  if (user && !loading && role) {
    console.log("Redirecting user with role:", role)
    if (role === "admin") {
      return <Navigate to="/admin" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasNumber = /\d/.test(password)

    return hasMinLength && hasSpecialChar && hasNumber
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInData.email || !signInData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const { error } = await signIn(signInData.email, signInData.password)
    setIsLoading(false)

    if (!error) {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signUpData.name || !signUpData.email || !signUpData.password || !signUpData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!validatePassword(signUpData.password)) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters with at least 1 special character and 1 number",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(signUpData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.name, signUpData.role)
    setIsLoading(false)

    if (!error) {
      setSignUpData({ name: "", email: "", password: "", confirmPassword: "", role: "student" })
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-muted/5 to-primary/3"
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-background/30" />
      
      {/* Additional animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse-soft"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* content */}
      <div className="w-full max-w-md relative z-10">
        {/* branding */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              <div className="relative p-5 bg-gradient-primary rounded-3xl shadow-strong animate-float">
                <GraduationCap className="h-12 w-12 text-primary-foreground" />
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-4 w-4 text-primary-foreground/80 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4 tracking-tight">CourseLens</h1>
          <p className="text-muted-foreground text-xl mb-2">Course Feedback & Management Platform</p>
          <div className="w-32 h-1 bg-gradient-primary mx-auto mt-6 rounded-full"></div>
        </div>

        {/* form */}
        <Card className="card-elevated glass-card animate-fade-in-up border-gradient shadow-strong">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl text-gradient mb-2">Welcome</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 backdrop-blur-sm border border-border/50 p-1">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-colored transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-colored transition-all duration-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* sign in */}
              <TabsContent value="signin" className="animate-scale-in">
                <form onSubmit={handleSignIn} className="space-y-7">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email" className="text-foreground font-semibold text-sm">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        className="pl-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signin-password" className="text-foreground font-semibold text-sm">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        className="pl-12 pr-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300 p-1"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-gradient h-14 text-lg font-semibold shadow-primary hover:shadow-glow transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Sign In</span>
                        <Shield className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* sign up */}
              <TabsContent value="signup" className="animate-scale-in">
                <form onSubmit={handleSignUp} className="space-y-6">
                  {/* name */}
                  <div className="space-y-3">
                    <Label htmlFor="signup-name" className="text-foreground font-semibold text-sm">
                      Full Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        className="pl-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* email */}
                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-foreground font-semibold text-sm">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className="pl-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* password */}
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-foreground font-semibold text-sm">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 chars, 1 special char, 1 number"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className="pl-12 pr-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300 p-1"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* confirm password */}
                  <div className="space-y-3">
                    <Label htmlFor="signup-confirm" className="text-foreground font-semibold text-sm">
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className="pl-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* role */}
                  <div className="space-y-3">
                    <Label htmlFor="signup-role" className="text-foreground font-semibold text-sm">
                      Account Type
                    </Label>
                    <div className="relative group">
                      <UserCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Select
                        value={signUpData.role}
                        onValueChange={(value) => setSignUpData({ ...signUpData, role: value as "student" | "admin" })}
                      >
                        <SelectTrigger className="pl-12 h-12 premium-input bg-muted/40 border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border backdrop-blur-xl">
                          <SelectItem value="student" className="hover:bg-muted/50">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Student</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin" className="hover:bg-muted/50">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Administrator</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-gradient h-14 text-lg font-semibold shadow-primary hover:shadow-glow transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Create Account</span>
                        <Sparkles className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-10 animate-fade-in-up">
          <div className="bg-card/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-border/50 shadow-soft">
            <p className="text-muted-foreground text-sm font-medium mb-2">POSSPOLE Web Application Assignment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
