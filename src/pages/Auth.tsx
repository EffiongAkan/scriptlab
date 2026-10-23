import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AdminPasscodeClaim } from "@/components/admin/AdminPasscodeClaim";
import { ArrowLeft, Mail, Key, CheckCircle2, Eye, EyeOff } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("signin");
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();

  // Password recovery states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Check for recovery URL tokens and auto-redirect if already logged in (except during recovery)
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const pathname = window.location.pathname;
    const isRecovery =
      hash.includes("type=recovery") ||
      search.includes("type=recovery") ||
      search.includes("mode=recovery") ||
      pathname === "/reset-password" ||
      pathname === "/update-password";

    if (isRecovery) {
      setIsRecoveryMode(true);
      return;
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isRecoveryMode) {
        if (activeTab === "claim" || sessionStorage.getItem("returnToClaim") === "true") {
          sessionStorage.removeItem("returnToClaim");
          setActiveTab("claim");
        } else {
          navigate("/dashboard");
        }
      }
    };
    checkUser();
  }, [navigate, activeTab, isRecoveryMode]);

  // Listen for Supabase password recovery event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    try {
      // Validate inputs
      authSchema.parse({ email, password });
      
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check your email to confirm your account!",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach(err => {
          if (err.path[0]) errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Error signing up",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    try {
      z.object({ email: z.string().email("Invalid email address"), password: z.string().min(1, "Password is required") }).parse({ email, password });
      
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      if (sessionStorage.getItem("returnToClaim") === "true") {
        sessionStorage.removeItem("returnToClaim");
        setActiveTab("claim");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach(err => {
          if (err.path[0]) errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Error signing in",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: "Recovery Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Could not send password recovery email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please confirm your new password matches.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated!",
        description: "Your password has been reset successfully. Welcome back!",
      });

      setIsRecoveryMode(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Your reset link may have expired.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] relative overflow-hidden selection:bg-naija-green/30">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/landing/hero-bg.png"
          alt="Cinematic Background"
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60" />
      </div>

      {/* Glowing Accents */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-naija-green/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-naija-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Branding Header */}
      <header className="w-full py-6 px-8 flex items-center justify-between relative z-20">
        <Link to="/" className="flex items-center gap-3 group transition-all hover:scale-105">
          <img src="/brand/logo.png" alt="Scriptyn Logo" className="h-11 w-auto min-w-[44px] drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
          <span className="text-white font-extrabold text-2xl md:text-3xl tracking-tighter transition-colors group-hover:text-naija-gold">Scriptyn</span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white font-medium transition-colors flex items-center gap-2">
          <span>Back to Home</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in-up">
        <div className="w-full max-w-md space-y-8">
          <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden rounded-2xl ring-1 ring-white/5">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-3xl font-bold text-white tracking-tight">
                {isRecoveryMode ? (
                  <>Set New <span className="text-naija-green">Password</span></>
                ) : isForgotPassword ? (
                  <>Reset <span className="text-naija-green">Password</span></>
                ) : (
                  <>Welcome to <span className="text-naija-green">Scriptyn</span></>
                )}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isRecoveryMode ? (
                  "Create a new secure password for your account"
                ) : isForgotPassword ? (
                  "We'll email you instructions to reset your password"
                ) : (
                  "Your AI-powered screenwriting studio"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* PASSWORD RECOVERY VIEW (When arriving from reset link) */}
              {isRecoveryMode ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password (min. 8 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-naija-green hover:bg-naija-green/90 text-white font-bold h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    disabled={loading}
                  >
                    {loading ? "Updating Password..." : "Update Password & Sign In"}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRecoveryMode(false)}
                      className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : isForgotPassword ? (
                /* FORGOT PASSWORD FORM (Request reset link) */
                <div className="space-y-6">
                  {resetSent ? (
                    <div className="space-y-5 text-center py-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-naija-green/10 border border-naija-green/30 flex items-center justify-center text-naija-green">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white font-semibold text-lg">Check Your Email</h4>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                          We've sent a password recovery link to{" "}
                          <span className="text-white font-medium">{resetEmail}</span>.
                          Please click the link in that email to create a new password.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(false);
                            setResetSent(false);
                          }}
                          className="w-full bg-naija-green hover:bg-naija-green/90 text-white font-bold h-11 rounded-xl"
                        >
                          Back to Sign In
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleSendResetEmail}
                          disabled={loading}
                          className="w-full text-xs text-gray-400 hover:text-white"
                        >
                          {loading ? "Resending..." : "Did not receive email? Resend"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendResetEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          type="email"
                          placeholder="Your Account Email Address"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all"
                        />
                        <p className="text-[11px] text-gray-500">
                          We will send a secure password reset link to this email address.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-naija-green hover:bg-naija-green/90 text-white font-bold h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        disabled={loading}
                      >
                        {loading ? "Sending Recovery Link..." : "Send Reset Link"}
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(false)}
                          className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Back to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* REGULAR AUTH TABS (Sign In, Sign Up, Claim) */
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-xl mb-8">
                    <TabsTrigger
                      value="signin"
                      className="rounded-lg data-[state=active]:bg-naija-green data-[state=active]:text-white transition-all font-semibold"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-lg data-[state=active]:bg-naija-green data-[state=active]:text-white transition-all font-semibold"
                    >
                      Sign Up
                    </TabsTrigger>
                    <TabsTrigger
                      value="claim"
                      className="rounded-lg data-[state=active]:bg-naija-gold/20 data-[state=active]:text-naija-gold border border-transparent data-[state=active]:border-naija-gold/30 transition-all font-semibold"
                    >
                      Claim
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-0 space-y-6">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setValidationErrors(prev => ({...prev, email: undefined})) }}
                            required
                            className={`bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all ${validationErrors.email ? 'border-red-500/50' : ''}`}
                          />
                          {validationErrors.email && <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Password</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsForgotPassword(true);
                                setResetSent(false);
                                setResetEmail(email || "");
                              }}
                              className="text-xs text-naija-green hover:text-naija-green/80 font-medium transition-colors hover:underline"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setValidationErrors(prev => ({...prev, password: undefined})) }}
                            required
                            className={`bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all ${validationErrors.password ? 'border-red-500/50' : ''}`}
                          />
                          {validationErrors.password && <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-naija-green hover:bg-naija-green/90 text-white font-bold h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </div>
                        ) : "Sign In"}
                      </Button>
                      <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
                        By continuing, you agree to our{' '}
                        <Link to="/terms-of-use" className="text-naija-green hover:underline">Terms of Use</Link>
                        {' '}and{' '}
                        <Link to="/privacy-policy" className="text-naija-green hover:underline">Privacy Policy</Link>.
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0 space-y-6">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setValidationErrors(prev => ({...prev, email: undefined})) }}
                            required
                            className={`bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all ${validationErrors.email ? 'border-red-500/50' : ''}`}
                          />
                          {validationErrors.email && <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>}
                        </div>
                        <div className="space-y-2">
                          <Input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setValidationErrors(prev => ({...prev, password: undefined})) }}
                            required
                            className={`bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all ${validationErrors.password ? 'border-red-500/50' : ''}`}
                          />
                          {validationErrors.password && <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-naija-green hover:bg-naija-green/90 text-white font-bold h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing up...</span>
                          </div>
                        ) : "Create Account"}
                      </Button>
                      <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
                        By continuing, you agree to our{' '}
                        <Link to="/terms-of-use" className="text-naija-green hover:underline">Terms of Use</Link>
                        {' '}and{' '}
                        <Link to="/privacy-policy" className="text-naija-green hover:underline">Privacy Policy</Link>.
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="claim" className="mt-0 animate-in fade-in zoom-in duration-300">
                    <AdminPasscodeClaim
                      onSuccess={() => navigate("/admin")}
                      onSignInRequired={() => setActiveTab("signin")}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {!isRecoveryMode && !isForgotPassword && (
            <p className="text-center text-sm text-gray-500">
              Need admin access?{' '}
              <button
                onClick={() => setActiveTab("claim")}
                className="text-naija-green hover:text-naija-green/80 font-semibold transition-colors hover:underline decoration-naija-green/30 underline-offset-4"
              >
                Go to admin portal
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
