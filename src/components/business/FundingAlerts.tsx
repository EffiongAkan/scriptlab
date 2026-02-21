
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const FundingAlerts: React.FC = () => {
  const [opps, setOpps] = useState<any[]>([]);
  const [apps, setApps] = useState<{ [key: string]: boolean }>({});
  const [userScripts, setUserScripts] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOpps = async () => {
      const { data } = await supabase.from("funding_opportunities").select("*").eq("is_active", true);
      if (data) setOpps(data);
    };
    const fetchScripts = async () => {
      const { data } = await supabase.from("scripts").select("id,title");
      setUserScripts(data || []);
    };
    fetchOpps();
    fetchScripts();
  }, []);

  const handleApply = async (fundingId: string, scriptId: string) => {
    if (!scriptId) {
      toast({ title: "Select a script", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("funding_applications").insert({ funding_id: fundingId, script_id: scriptId });
    if (!error) {
      setApps(a => ({ ...a, [fundingId]: true }));
      toast({ title: "Applied!", description: "Your application has been submitted." });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Funding Opportunities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opps.map(f => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <div className="text-xs text-muted-foreground">{f.deadline ? "Deadline: " + new Date(f.deadline).toLocaleDateString() : "No deadline"}</div>
              <div className="text-xs mb-2">{f.eligibility}</div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm">{f.description}</p>
              {f.url && <a href={f.url} target="_blank" className="block text-naija-green text-xs mb-2">More details</a>}
              <div className="flex items-center gap-2">
                <select className="p-2 border rounded w-48" id={"scriptselect-" + f.id} defaultValue="">
                  <option value="">Select your script</option>
                  {userScripts.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <Button
                  disabled={!!apps[f.id]}
                  onClick={() => {
                    const scriptSelect = document.getElementById("scriptselect-" + f.id) as HTMLSelectElement | null;
                    if (scriptSelect) handleApply(f.id, scriptSelect.value);
                  }}
                >{apps[f.id] ? "Applied" : "Apply"}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {opps.length === 0 && <span className="text-muted-foreground text-sm">No funding opportunities at the moment.</span>}
      </div>
    </div>
  );
};
