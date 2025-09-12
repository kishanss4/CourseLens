-- Add foreign key constraints to the feedback table for proper joins
ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;