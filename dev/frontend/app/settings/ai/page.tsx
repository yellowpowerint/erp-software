"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BrainCircuit, ArrowLeft, Save, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { UserRole } from "@/types/auth";

interface ProviderStatus {
  configured: boolean;
  last4: string | null;
  model: string | null;
  updatedAt: string | null;
}

interface AiSettingsResponse {
  enabled: boolean;
  defaultProvider: "OPENAI" | "CLAUDE" | null;
  openai: ProviderStatus;
  claude: ProviderStatus;
}

function AiSettingsContent() {
  const [settings, setSettings] = useState<AiSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [defaultProvider, setDefaultProvider] = useState<
    "OPENAI" | "CLAUDE" | null
  >("OPENAI");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [claudeModel, setClaudeModel] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/settings/ai");
        const data: AiSettingsResponse = response.data;
        setSettings(data);
        setEnabled(data.enabled);
        setDefaultProvider(data.defaultProvider);
        setOpenaiModel(data.openai.model || "");
        setClaudeModel(data.claude.model || "");
      } catch (error) {
        console.error("Failed to fetch AI settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        enabled,
        defaultProvider: enabled ? defaultProvider : null,
        openai: {
          model: openaiModel || null,
        },
        claude: {
          model: claudeModel || null,
        },
      };

      if (openaiApiKey.trim()) {
        payload.openai.apiKey = openaiApiKey.trim();
      }

      if (claudeApiKey.trim()) {
        payload.claude.apiKey = claudeApiKey.trim();
      }

      const response = await api.put("/settings/ai", payload);
      const data: AiSettingsResponse = response.data;
      setSettings(data);
      setEnabled(data.enabled);
      setDefaultProvider(data.defaultProvider);
      setOpenaiModel(data.openai.model || "");
      setClaudeModel(data.claude.model || "");

      // Clear key inputs after successful save so we never echo secrets
      setOpenaiApiKey("");
      setClaudeApiKey("");
    } catch (error) {
      console.error("Failed to save AI settings:", error);
      alert("Failed to save AI settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI & Integrations (BYOK)
              </h1>
              <p className="text-gray-600">
                Configure OpenAI and Claude API keys used for AI-powered
                features.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Global AI Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Global AI Settings
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Enable AI Features
                </p>
                <p className="text-xs text-gray-500">
                  When disabled, AI-driven pages will fall back to basic
                  behavior.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">
                Default Provider
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="radio"
                    name="defaultProvider"
                    value="OPENAI"
                    disabled={!enabled}
                    checked={defaultProvider === "OPENAI"}
                    onChange={() => setDefaultProvider("OPENAI")}
                    className="text-indigo-600 border-gray-300"
                  />
                  <span>OpenAI</span>
                </label>
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="radio"
                    name="defaultProvider"
                    value="CLAUDE"
                    disabled={!enabled}
                    checked={defaultProvider === "CLAUDE"}
                    onChange={() => setDefaultProvider("CLAUDE")}
                    className="text-indigo-600 border-gray-300"
                  />
                  <span>Claude</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The default provider is used when multiple AI integrations are
                configured.
              </p>
            </div>
          </div>
        </div>

        {/* OpenAI Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-gray-900">OpenAI</h2>
            </div>
            {settings?.openai.configured ? (
              <span className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                Configured
                {settings.openai.last4 && (
                  <span className="ml-1 text-green-600">
                    (•••• {settings.openai.last4})
                  </span>
                )}
              </span>
            ) : (
              <span className="px-3 py-1 text-xs rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                Not configured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder={
                  settings?.openai.configured
                    ? "Enter a new key to rotate (leave blank to keep current)"
                    : "Enter your OpenAI API key"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keys are stored securely on the server and never shown back in
                full.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Model (optional)
              </label>
              <input
                type="text"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                placeholder="e.g. gpt-4.1-mini"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Claude Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Claude</h2>
            </div>
            {settings?.claude.configured ? (
              <span className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                Configured
                {settings.claude.last4 && (
                  <span className="ml-1 text-green-600">
                    (•••• {settings.claude.last4})
                  </span>
                )}
              </span>
            ) : (
              <span className="px-3 py-1 text-xs rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                Not configured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claude API Key
              </label>
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder={
                  settings?.claude.configured
                    ? "Enter a new key to rotate (leave blank to keep current)"
                    : "Enter your Claude API key"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keys are stored securely on the server and never shown back in
                full.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Model (optional)
              </label>
              <input
                type="text"
                value={claudeModel}
                onChange={(e) => setClaudeModel(e.target.value)}
                placeholder="e.g. claude-3.5-sonnet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/settings"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save AI Settings"}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function AiSettingsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.IT_MANAGER]}
    >
      <AiSettingsContent />
    </ProtectedRoute>
  );
}
