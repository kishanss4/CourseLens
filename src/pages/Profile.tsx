"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { User, Mail, Phone, Calendar, MapPin, Camera, Shield, Edit3, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navigation } from "@/components/Navigation"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

export default function Profile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    profile_picture_url: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return
    try {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      if (data) {
        setProfile({
          name: data.name || user.user_metadata?.full_name || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          address: data.address || "",
          profile_picture_url: data.profile_picture_url || "",
        })
      } else {
        // If no profile exists, create one with metadata
        const newProfile = {
          name: user.user_metadata?.full_name || "",
          phone: "",
          date_of_birth: "",
          address: "",
          profile_picture_url: "",
        }
        setProfile(newProfile)
        
        // Create the profile record
        await supabase.from("profiles").insert({
          user_id: user.id,
          name: user.user_metadata?.full_name || "",
          email: user.email,
          phone: null,
          date_of_birth: null,
          address: null,
          profile_picture_url: null
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setUploadingImage(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `avatar.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("profile-pictures").getPublicUrl(filePath)
      const updatedProfile = { ...profile, profile_picture_url: data.publicUrl }
      setProfile(updatedProfile)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: data.publicUrl })
        .eq("user_id", user.id)
      if (updateError) throw updateError
      toast({ title: "Success!", description: "Profile picture updated successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle()

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(profile)
          .eq("user_id", user?.id)
        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user?.id,
            email: user?.email,
            ...profile
          })
        if (error) throw error
      }

      toast({ title: "Success!", description: "Profile updated successfully" })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Improved initials calculation
  const getInitials = () => {
    if (profile.name && profile.name.trim()) {
      return profile.name.trim().split(" ").map((n) => n[0]).join("").toUpperCase()
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  const initials = getInitials()

  // Display name priority: profile.name -> user metadata -> email
  const displayName = profile.name || user?.user_metadata?.full_name || user?.email || "Unknown User"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/3">
      <Navigation />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-60"></div>
                <div className="relative p-3 bg-gradient-primary rounded-2xl shadow-strong">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">Profile Settings</h1>
                <p className="text-muted-foreground text-lg">Welcome, {displayName}</p>
                <p className="text-muted-foreground text-sm">Manage your personal information and preferences</p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "destructive" : "default"}
              className={isEditing ? "bg-destructive hover:bg-destructive/90" : "btn-gradient"}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </>
              )}
            </Button>
          </div>
          <div className="w-40 h-1.5 bg-gradient-primary rounded-full shadow-glow"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Card */}
          <Card className="card-elevated glass-card animate-fade-in-up lg:col-span-1">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Profile Picture</CardTitle>
              <CardDescription>Update your avatar</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <Avatar className="relative h-32 w-32 border-4 border-border/50 shadow-strong">
                  <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt="Profile" className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 shadow-medium border-2 border-background"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Click the camera icon to upload a new profile picture</p>
                <p className="text-xs text-muted-foreground/80">Supported formats: JPG, PNG, GIF (max 5MB)</p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Form */}
          <Card className="card-elevated glass-card animate-fade-in-up lg:col-span-2" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Shield className="h-6 w-6 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription className="text-base">
                {isEditing ? "Update your profile details below" : "Your current profile information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                    <div className="form-field-wrapper group">
                      <User className="input-icon" />
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="pl-12 h-12 premium-input"
                        placeholder="Your full name"
                        disabled={!isEditing}
                      />
                    </div>
                    {!profile.name && !isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Name not set. Click "Edit Profile" to add your name.
                      </p>
                    )}
                  </div>

                  {/* Email (disabled) */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                    <div className="form-field-wrapper group">
                      <Mail className="input-icon" />
                      <Input
                        id="email"
                        value={user?.email || ""}
                        className="pl-12 h-12 bg-muted/30 border-border/30 text-muted-foreground"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                    <div className="form-field-wrapper group">
                      <Phone className="input-icon" />
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="pl-12 h-12 premium-input"
                        placeholder="Your phone number"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-3">
                    <Label htmlFor="dob" className="text-sm font-semibold">Date of Birth</Label>
                    <div className="form-field-wrapper group">
                      <Calendar className="input-icon" />
                      <Input
                        id="dob"
                        type="date"
                        value={profile.date_of_birth}
                        onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                        className="pl-12 h-12 premium-input"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
                  <div className="form-field-wrapper group">
                    <MapPin className="input-icon top-4" />
                    <Textarea
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="pl-12 min-h-[100px] resize-none premium-input"
                      placeholder="Your full address"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Save / Cancel */}
                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        fetchProfile()
                      }}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="btn-gradient px-8">
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Security Card */}
        <Card className="card-elevated glass-card animate-fade-in-up mt-8" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="h-6 w-6 text-warning" /> Account Security
            </CardTitle>
            <CardDescription className="text-base">Manage your account security and privacy settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                <h4 className="font-semibold text-foreground mb-2">Account Status</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-success font-medium">Active & Verified</span>
                </div>
              </div>
              <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                <h4 className="font-semibold text-foreground mb-2">Last Login</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}