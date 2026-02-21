import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";

export const UserProfileCard = () => {
    const { profile, loading } = useProfile();
    const navigate = useNavigate();

    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Default values if profile is incomplete
    const displayName = profile?.full_name || profile?.username || "Writer";
    const displayEmail = profile?.email || "No email";
    const memberSince = new Date(); // In a real app, this would come from profile.created_at

    return (
        <Card className="h-full border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-500" />
                        <CardTitle className="text-lg">Writer Profile</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} title="Edit Profile">
                        <Settings className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                    </Button>
                </div>
                <CardDescription>Your creative identity</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4 py-2 w-full">
                    <Avatar className="h-20 w-20 border-2 border-indigo-500/30 shadow-sm shrink-0">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-indigo-900/50 text-indigo-200 text-xl font-bold border border-indigo-500/30">
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
                        <h3 className="font-bold text-xl text-white truncate" title={displayName}>{displayName}</h3>
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-slate-300">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate" title={displayEmail}>{displayEmail}</span>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 mt-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Member since {format(memberSince, "MMM yyyy")}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button variant="outline" className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/50 hover:text-indigo-200" onClick={() => navigate("/settings")}>
                    Manage Account
                </Button>
            </CardFooter>
        </Card>
    );
};
