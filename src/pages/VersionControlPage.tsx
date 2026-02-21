
import React from "react";
import { VersionControlPanel } from "@/components/script-editor/version-control/VersionControlPanel";
import { useParams } from "react-router-dom";

export default function VersionControlPage() {
  // Optionally get scriptId from query or route, here just display generic panel
  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">Version Control</h1>
      <VersionControlPanel scriptId="" />
    </div>
  );
}
