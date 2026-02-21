
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";

// Script registration with PDF certificate download
export const ScriptRegistration: React.FC = () => {
  const [scriptOptions, setScriptOptions] = useState([]);
  const [selectedScript, setSelectedScript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchScripts = async () => {
      const { data, error } = await supabase.from("scripts").select("id,title");
      if (data) setScriptOptions(data);
    };
    const fetchRegistrations = async () => {
      const { data, error } = await supabase.from("script_registrations").select("*").order("registered_at", { ascending: false });
      if (data) setRegistrations(data);
    };
    fetchScripts();
    fetchRegistrations();
  }, [submitting]);

  const handleRegister = async () => {
    if (!selectedScript) {
      toast({ title: "Select script", variant: "destructive" }); return;
    }
    setSubmitting(true);
    // Find title for easy access
    const script = scriptOptions.find((s: any) => s.id === selectedScript);
    const { error } = await supabase.from("script_registrations").insert({ script_id: selectedScript, title: script?.title || "" });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registered", description: "Script registered!" });
      setSelectedScript("");
    }
  };

  const generatePdf = (r: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Script Registration Certificate", 105, 30, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Script Title: ${r.title || "Untitled"}`, 20, 50);
    doc.text(`Script ID: ${r.script_id}`, 20, 60);
    doc.text(`Registered: ${new Date(r.registered_at).toLocaleString()}`, 20, 70);
    doc.text("This document certifies the registration of the above script in ScriptLab with a secure timestamp.", 20, 90, { maxWidth: 170 });
    doc.save(`script_certificate_${r.script_id}.pdf`);
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Register your script</h3>
      <div className="flex gap-2 mb-2">
        <select className="p-2 border rounded w-48" value={selectedScript} onChange={e => setSelectedScript(e.target.value)}>
          <option value="">Select script</option>
          {scriptOptions.map((s: any) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <Button onClick={handleRegister} disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : "Register"}</Button>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Your Script Registrations</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {registrations.map((r, i) => (
              <li key={r.id || i} className="border-b pb-2">
                <div className="text-sm font-medium">{r.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground">
                  Script ID: {r.script_id} | Registered: {new Date(r.registered_at).toLocaleString()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => generatePdf(r)}
                >
                  <Download className="h-4 w-4 mr-1" /> Download PDF Certificate
                </Button>
              </li>
            ))}
            {registrations.length === 0 && <p className="text-muted-foreground text-sm">No script registrations yet.</p>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
