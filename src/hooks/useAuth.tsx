import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'student' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role: 'student' | 'admin') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check role in metadata first
          const metadataRole = session.user.user_metadata?.role as string | undefined;
          if (metadataRole && (metadataRole === 'admin' || metadataRole === 'student')) {
            setRole(metadataRole as UserRole);
            setLoading(false);
          } else {
            // Fetch user role from database
            setTimeout(async () => {
              try {
                console.log('Fetching role for user:', session.user.id);
                const { data: roleData, error } = await supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', session.user.id)
                  .maybeSingle();
                
                console.log('Role data:', roleData, 'Error:', error);
                
                const userRole = roleData?.role as UserRole || 'student';
                console.log('Setting role to:', userRole);
                setRole(userRole);
                setLoading(false);
              } catch (error) {
                console.error('Error fetching user role:', error);
                setRole('student');
                setLoading(false);
              }
            }, 0);
          }
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check role in metadata first
        const metadataRole = session.user.user_metadata?.role as string | undefined;
        if (metadataRole && (metadataRole === 'admin' || metadataRole === 'student')) {
          setRole(metadataRole as UserRole);
          setLoading(false);
        } else {
          // Fetch user role from database
          setTimeout(async () => {
            try {
              const { data: roleData, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              const userRole = roleData?.role as UserRole || 'student';
              setRole(userRole);
              setLoading(false);
            } catch (error) {
              console.error('Error fetching user role:', error);
              setRole('student');
              setLoading(false);
            }
          }, 0);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'admin' = 'student') => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            name: name,
            role: role,
          },
        },
      });
      
      if (signUpError) {
        toast({
          title: "Sign Up Failed",
          description: signUpError.message,
          variant: "destructive",
        });
        return { error: signUpError };
      }

      if (data.user) {
        try {
          // Wait a moment for the user to be fully created
          await new Promise(resolve => setTimeout(resolve, 100));

          // Create profile record with name and email
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              user_id: data.user.id,
              name: name,
              email: email,
              phone: null,
              date_of_birth: null,
              address: null,
              profile_picture_url: null,
              is_blocked: false
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
          }

          // Assign role using the secure function
          const { error: roleError } = await supabase.rpc('assign_role_if_missing', { 
            user_id: data.user?.id,
            role_name: role 
          });
          
          if (roleError) {
            console.error("Role assignment error:", roleError);
          }

          toast({
            title: "Success!",
            description: "Please check your email to verify your account.",
          });

        } catch (insertError: any) {
          console.error("Error creating profile/role:", insertError);
          toast({
            title: "Account Created",
            description: "Account created but there was an issue setting up your profile. You can update it later.",
            variant: "destructive",
          });
        }
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user?.id);
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}