
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";

// Copyright/IP management: list, register, download certificate (PDF)
export const CopyrightManager: React.FC = () => {
  const [scriptOptions, setScriptOptions] = useState([]);
  const [selectedScript, setSelectedScript] = useState("");
  const [claim, setClaim] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copyrights, setCopyrights] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchScripts = async () => {
      const { data, error } = await supabase.from("scripts").select("id,title");
      if (data) setScriptOptions(data);
    };
    const fetchCopy = async () => {
      const { data, error } = await supabase.from("script_copyrights").select("*").order("registered_at", { ascending: false });
      if (data) {
        setCopyrights(data);
      }
    };
    fetchScripts();
    fetchCopy();
  }, [submitting]);

  const handleRegister = async () => {
    if (!selectedScript || !claim) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("script_copyrights").insert({ script_id: selectedScript, copyright_claim: claim });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registered", description: "Copyright registered!" });
      setSelectedScript("");
      setClaim("");
    }
  };

  // PDF Certificate generation for download
  const generatePdf = (item: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Certificate of Copyright/IP Registration", 105, 30, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Registered To: Your Account`, 20, 50);
    doc.text(`Script ID: ${item.script_id}`, 20, 60);
    doc.text(`Claim: ${item.copyright_claim}`, 20, 70);
    doc.text(`Registered: ${new Date(item.registered_at).toLocaleString()}`, 20, 80);
    doc.text("This certificate confirms that the above copyright/IP claim was registered and timestamped in the ScriptLab system.", 20, 100, { maxWidth: 170 });
    doc.save(`copyright_certificate_${item.script_id}.pdf`);
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Register new copyright/IP claim</h3>
      <div className="flex gap-2 mb-2">
        <select className="p-2 border rounded w-48" value={selectedScript} onChange={e => setSelectedScript(e.target.value)}>
          <option value="">Select script</option>
          {scriptOptions.map((s: any) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <Input
          className="w-64"
          placeholder="Describe copyright/IP claim"
          value={claim}
          onChange={e => setClaim(e.target.value)}
        />
        <Button onClick={handleRegister} disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : "Register"}</Button>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Your Registered Copyright/IP Claims</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {copyrights.map((c, i) => (
              <li key={c.id || i} className="border-b pb-2">
                <div className="text-sm font-medium">{c.copyright_claim}</div>
                <div className="text-xs text-muted-foreground">Script ID: {c.script_id} | Registered: {new Date(c.registered_at).toLocaleString()}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => generatePdf(c)}
                >
                  <Download className="h-4 w-4 mr-1" /> Download PDF Certificate
                </Button>
              </li>
            ))}
            {copyrights.length === 0 && <p className="text-muted-foreground text-sm">No copyrights registered yet.</p>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
