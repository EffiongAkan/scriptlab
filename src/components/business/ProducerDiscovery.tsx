
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const ProducerDiscovery: React.FC = () => {
  const [search, setSearch] = useState("");
  const [producers, setProducers] = useState<any[]>([]);
  useEffect(() => {
    const fetchProducers = async () => {
      const { data } = await supabase.from("verified_producers").select("*").eq("is_active", true);
      if (data) setProducers(data);
    };
    fetchProducers();
  }, []);
  const filtered = producers.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(search.toLowerCase());
    const companyMatch = (p.company || "").toLowerCase().includes(search.toLowerCase());
    return nameMatch || companyMatch;
  });
  return (
    <div>
      <h3 className="font-semibold mb-2">Discover Verified Producers</h3>
      <Input placeholder="Search producers or companies..." value={search} onChange={e => setSearch(e.target.value)} className="mb-3 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p, i) => (
          <Card key={p.id || i}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <div className="text-sm text-muted-foreground">{p.company}</div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex flex-wrap gap-1">
                {p.focus_genres?.map((g: string) => (
                  <Badge variant="secondary" key={g}>{g}</Badge>
                ))}
              </div>
              {p.profile_url && <a href={p.profile_url} target="_blank" className="block text-naija-green text-xs mb-1">Profile</a>}
              <div className="text-xs">
                <span className="font-medium">Contact:</span> {p.contact_email}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <span className="text-muted-foreground text-sm">No producers found.</span>}
      </div>
    </div>
  );
};
