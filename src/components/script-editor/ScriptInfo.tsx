
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScriptInfoProps {
  scriptId: string;
}

export const ScriptInfo = ({ scriptId }: ScriptInfoProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Script Information</CardTitle>
        <CardDescription>Details about your screenplay</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Script ID</p>
            <p className="text-sm text-muted-foreground">{scriptId}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Format</p>
            <p className="text-sm text-muted-foreground">Screenplay</p>
          </div>
          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge variant="outline" className="text-xs">Draft</Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Last modified</p>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
