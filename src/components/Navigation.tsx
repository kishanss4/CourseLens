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
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('profile_picture_url')
          .eq('user_id', user.id)
          .single();

        if (data?.profile_picture_url) {
          setProfilePictureUrl(data.profile_picture_url);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePicture();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('')
    : user?.email?.substring(0, 2).toUpperCase();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">CourseLens</span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {role === 'student' && (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      <BarChart className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
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