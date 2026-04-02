import { PresetCard } from "./preset-card";
import { GuardRailsManager } from "./guard-rails-manager";

const PRESETS = [
  {
    title: "Australian Spam Act",
    flag: "🇦🇺",
    subtitle: "Complies with the Spam Act 2003 and ACMA guidelines for automated calling.",
    rules: [
      "Identify as an AI voice assistant at the start of every call",
      "State the company name you are calling on behalf of",
      "Offer the option to be removed from the call list if requested",
    ],
    guardRails: [
      {
        description: "Always identify yourself as an AI voice assistant at the start of every call",
        action: "block",
      },
      {
        description: "Always state the company name you are calling on behalf of",
        action: "block",
      },
      {
        description: "Always offer the option to be removed from the call list if requested",
        action: "block",
      },
    ],
  },
  {
    title: "TCPA (United States)",
    flag: "🇺🇸",
    subtitle: "Complies with the Telephone Consumer Protection Act requirements for automated calls.",
    rules: [
      "Identify as an automated calling system at the start of every call",
      "State your name and company name at the start of every call",
      "Inform the caller that this call may be recorded",
      "Stop the call immediately if asked to be placed on the do-not-call list",
    ],
    guardRails: [
      {
        description: "Identify yourself as an automated calling system at the start of every call",
        action: "block",
      },
      {
        description: "State your name and company name at the start of every call",
        action: "block",
      },
      {
        description: "Inform the caller that this call may be recorded",
        action: "block",
      },
      {
        description:
          "Immediately stop the call if the person asks to be placed on the do-not-call list",
        action: "block",
      },
    ],
  },
  {
    title: "GDPR (European Union)",
    flag: "🇪🇺",
    subtitle: "Complies with General Data Protection Regulation requirements for data transparency.",
    rules: [
      "State the purpose of data collection if asked",
      "Inform callers they can request deletion of their data",
    ],
    guardRails: [
      {
        description: "State the purpose of data collection if asked",
        action: "warn",
      },
      {
        description: "Inform callers they can request deletion of their data",
        action: "warn",
      },
    ],
  },
];

export default function CompliancePage() {
  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Compliance</h1>
        <p className="text-muted-foreground text-sm">
          Manage guard rails that constrain your AI agents to meet legal and regulatory requirements.
        </p>
      </div>

      {/* Section A — Compliance Presets */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Compliance Presets</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Apply a preset to automatically create the guard rails required for each jurisdiction.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.title}
              title={preset.title}
              flag={preset.flag}
              subtitle={preset.subtitle}
              rules={preset.rules}
              guardRails={preset.guardRails}
            />
          ))}
        </div>
      </section>

      {/* Section B — Custom Guard Rails */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Custom Guard Rails</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View, manage, and add your own guard rails for fine-grained agent behaviour control.
          </p>
        </div>
        <GuardRailsManager />
      </section>
    </div>
  );
}
