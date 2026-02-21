
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyrightManager } from "./CopyrightManager";
import { ScriptRegistration } from "./ScriptRegistration";
import { ProducerDiscovery } from "./ProducerDiscovery";
import { FundingAlerts } from "./FundingAlerts";
import { Shield, ClipboardList, Users, DollarSign } from "lucide-react";

export const BusinessToolsPanel: React.FC = () => {
  const [tab, setTab] = useState("copyright");
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Business Tools</h2>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="copyright"><Shield className="h-4 w-4 mr-1" />Copyright/IP</TabsTrigger>
          <TabsTrigger value="registration"><ClipboardList className="h-4 w-4 mr-1" />Registration</TabsTrigger>
          <TabsTrigger value="producers"><Users className="h-4 w-4 mr-1" />Producers</TabsTrigger>
          <TabsTrigger value="funding"><DollarSign className="h-4 w-4 mr-1" />Funding</TabsTrigger>
        </TabsList>
        <TabsContent value="copyright" className="mt-6"><CopyrightManager /></TabsContent>
        <TabsContent value="registration" className="mt-6"><ScriptRegistration /></TabsContent>
        <TabsContent value="producers" className="mt-6"><ProducerDiscovery /></TabsContent>
        <TabsContent value="funding" className="mt-6"><FundingAlerts /></TabsContent>
      </Tabs>
    </div>
  );
};
