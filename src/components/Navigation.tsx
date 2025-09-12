import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User, BarChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function Navigation() {
  const { user, role, signOut, loading: authLoading } = useAuth(); // Destructure loading from useAuth
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [initials, setInitials] = useState<string>('');

  useEffect(() => {
    const fetchProfilePictureAndInitials = async () => {
      if (!user) {
        setProfilePictureUrl('');
        setInitials('');
        return;
      }

      // Generate initials from user's name metadata or email
      const userInitials = user.user_metadata?.name
        ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : user.email?.substring(0, 2).toUpperCase();
      setInitials(userInitials || '');

      try {
        const { data } = await supabase
          .from('profiles')
          .select('profile_picture_url')
          .eq('user_id', user.id)
          .single();

        if (data?.profile_picture_url) {
          setProfilePictureUrl(data.profile_picture_url);
        } else {
          setProfilePictureUrl('');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        setProfilePictureUrl('');
      }
    };

    fetchProfilePictureAndInitials();
  }, [user]);

  const handleSignOut = async () => {
    if (user) { // Only call signOut if a user is actually logged in
      await signOut();
      navigate('/');
    } else {
      // In case of an auth session missing error, we can still redirect
      // to the login page to ensure a clean state.
      navigate('/');
    }
  };

  if (authLoading) {
    // Optionally render a loading state for navigation if authentication is still loading
    return null;
  }

  return (
    <nav className="bg-background shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and App Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">CourseLens</span>
            </Link>
          </div>

          {/* Navigation Links and User Menu */}
          {user && (
            <div className="flex items-center space-x-4">
              {role === 'student' && (
                <>
          
                  <Link to="/feedback">
                    <Button variant="ghost" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Feedback
                    </Button>
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <BarChart className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profilePictureUrl || user?.user_metadata?.avatar_url} alt="Profile" />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}