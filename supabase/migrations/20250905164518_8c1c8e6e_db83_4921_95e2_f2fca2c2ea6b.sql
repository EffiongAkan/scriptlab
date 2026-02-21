-- Function to add AI credits to a user (admin only)
CREATE OR REPLACE FUNCTION public.add_user_credits(target_user_id UUID, credits_to_add INTEGER)
RETURNS TABLE(success BOOLEAN, new_credits INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_credits INTEGER;
    updated_credits INTEGER;
BEGIN
    -- Check if the calling user is an admin
    IF NOT public.is_admin() THEN
        RETURN QUERY SELECT FALSE, 0, 'Unauthorized: Admin access required'::TEXT;
        RETURN;
    END IF;

    -- Get current credits
    SELECT ai_credits INTO current_credits 
    FROM public.profiles 
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Update credits
    UPDATE public.profiles 
    SET ai_credits = ai_credits + credits_to_add 
    WHERE id = target_user_id
    RETURNING ai_credits INTO updated_credits;
    
    RETURN QUERY SELECT TRUE, updated_credits, 'Credits added successfully'::TEXT;
END;
$$;