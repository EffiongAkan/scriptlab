
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skipEmailVerification, setSkipEmailVerification] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createAdminRecord = async (userId: string, userEmail: string) => {
    try {
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([
          {
            user_id: userId,
            email: userEmail,
            role: 'admin',
            is_active: false,
            status: 'pending'
          }
        ]);

      if (adminError) {
        console.error('Admin record creation error:', adminError);
        return false;
      }

      console.log('Admin record created successfully');
      return true;
    } catch (err) {
      console.error('Error creating admin record:', err);
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Starting admin signup process...');

      // Sign up the user
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Set redirect URL for email confirmation
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        throw signupError;
      }

      if (!signupData.user) {
        throw new Error('User creation failed - no user returned');
      }

      console.log('User created successfully:', signupData.user.id);

      // Create admin record immediately
      const adminCreated = await createAdminRecord(signupData.user.id, email);

      if (!signupData.session) {
        // User needs email confirmation
        toast({
          title: "Email Confirmation Required",
          description: adminCreated
            ? "Please verify your email. Once verified, your admin account will be pending approval from a Super Admin."
            : "Please check your email to confirm your account. You may need to contact support for admin privileges.",
        });

        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      // User is automatically confirmed
      if (adminCreated) {
        toast({
          title: "Signup Successful",
          description: "Your admin account has been created and is pending approval from a Super Admin. You will not have admin access until approved.",
        });
        setTimeout(() => navigate('/auth'), 3000);
      } else {
        toast({
          title: "Partial Success",
          description: "User account created but admin privileges couldn't be set. Please contact support.",
          variant: "default"
        });
        setTimeout(() => navigate('/auth'), 2000);
      }

    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = "Failed to create admin account";

      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address";
        } else if (error.message.includes('Password')) {
          errorMessage = "Please check your password requirements";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Signup</CardTitle>
          <p className="text-muted-foreground">Create your admin account</p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will create an admin account with full system privileges. Make sure you're authorized to create admin accounts.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder="Enter a strong password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Confirm your password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
