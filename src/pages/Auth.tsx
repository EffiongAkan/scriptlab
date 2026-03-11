
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminPasscodeClaim } from "@/components/admin/AdminPasscodeClaim";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("signin");
  const { toast } = useToast();

  // Auto-redirect if already logged in (only from signin/signup tabs)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (activeTab === "claim" || sessionStorage.getItem("returnToClaim") === "true") {
          sessionStorage.removeItem("returnToClaim");
          setActiveTab("claim");
        } else {
          navigate("/dashboard");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
    try {
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
      toast({
        title: "Error",
        description: error.message || "Error signing in",
        variant: "destructive"
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
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-lg">
            <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-8 w-auto min-w-[32px]" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">ScriptLab</span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white font-medium transition-colors flex items-center gap-2">
          <span>Back to Home</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in-up">
        <div className="w-full max-w-md space-y-8">
          <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden rounded-2xl ring-1 ring-white/5">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-3xl font-bold text-white tracking-tight">Welcome to <span className="text-naija-green">ScriptLab</span></CardTitle>
              <CardDescription className="text-gray-400">Your AI-powered screenwriting studio</CardDescription>
            </CardHeader>
            <CardContent>
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
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all"
                        />
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
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="password"
                          placeholder="Create Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-naija-green/50 transition-all"
                        />
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
                  </form>
                </TabsContent>

                <TabsContent value="claim" className="mt-0 animate-in fade-in zoom-in duration-300">
                  <AdminPasscodeClaim
                    onSuccess={() => navigate("/admin")}
                    onSignInRequired={() => setActiveTab("signin")}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500">
            Need admin access?{' '}
            <button
              onClick={() => setActiveTab("claim")}
              className="text-naija-green hover:text-naija-green/80 font-semibold transition-colors hover:underline decoration-naija-green/30 underline-offset-4"
            >
              Go to admin portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
