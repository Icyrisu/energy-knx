import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Clock,
  Cpu,
  Globe,
  Moon,
  Save,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';
import { AlarmRule, AppSettings, MeterConfig } from '@energy/shared';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../services/api';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'alarms'>('system');
  const [meters, setMeters] = useState<MeterConfig[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    displayTimezone: 'Asia/Jakarta',
    staleAfterSeconds: 10,
    defaultTrendRange: '24h',
    theme: 'dark',
    historyIntervalSeconds: 60,
  });
  const [alarmRules, setAlarmRules] = useState<AlarmRule[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    Promise.all([
      api.getMeters().catch(() => []),
      api.getSettings().catch(() => ({
        displayTimezone: 'Asia/Jakarta',
        staleAfterSeconds: 10,
        defaultTrendRange: '24h',
        theme: 'dark' as const,
        historyIntervalSeconds: 60,
      })),
      api.getAlarmRules().catch(() => []),
    ]).then(([mList, s, rules]) => {
      setMeters(mList);
      setSettings(s);
      setAlarmRules(rules);
    });
  }, []);

  const triggerSaved = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  const handleUpdateMeter = async (id: string, name: string, description: string) => {
    try {
      await api.updateMeter(id, { name, description });
      triggerSaved('Meter information saved');
    } catch (err) {
      console.error('Failed to update meter:', err);
    }
  };

  const handleUpdateSetting = async (key: string, value: unknown) => {
    try {
      const updated = await api.updateSetting(key, value);
      setSettings(updated);
      triggerSaved('Preferences saved');
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const handleRuleToggle = async (id: number, currentEnabled: boolean) => {
    try {
      await api.updateAlarmRule(id, { enabled: !currentEnabled });
      setAlarmRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !currentEnabled } : r))
      );
      triggerSaved('Alarm rule status updated');
    } catch (err) {
      console.error('Failed to toggle alarm rule:', err);
    }
  };

  const handleRuleThresholdChange = async (id: number, threshold: number) => {
    try {
      await api.updateAlarmRule(id, { threshold });
      setAlarmRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, threshold } : r))
      );
      triggerSaved('Threshold updated');
    } catch (err) {
      console.error('Failed to update rule threshold:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#26262b]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Settings &amp; Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Meter identity, logging intervals, localization, and alarm threshold rules
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{savedSuccess}</span>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'system' | 'alarms')}>
        <TabsList className="bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#26262b]">
          <TabsTrigger value="system" className="text-xs font-medium">
            System &amp; Display
          </TabsTrigger>
          <TabsTrigger value="alarms" className="text-xs font-medium">
            Alarm Thresholds ({alarmRules.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab 1: System & Display Settings */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Section: Meter Identities */}
          <Card className="p-5 bg-white dark:bg-[#18181b] border-slate-200/80 dark:border-[#26262b] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Meter Identity &amp; Labels
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {meters.map((meter) => (
                <div
                  key={meter.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/70 dark:bg-[#18181b] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ID: {meter.id}
                    </span>
                    <span className="text-[11px] text-slate-400">Index #{meter.sortOrder}</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id={`name-${meter.id}`}
                      defaultValue={meter.name}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#26262b] bg-white dark:bg-[#18181b] text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                      Description / Location
                    </label>
                    <input
                      type="text"
                      id={`desc-${meter.id}`}
                      defaultValue={meter.description || ''}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#26262b] bg-white dark:bg-[#18181b] text-xs font-medium"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      const nameInput = document.getElementById(`name-${meter.id}`) as HTMLInputElement;
                      const descInput = document.getElementById(`desc-${meter.id}`) as HTMLInputElement;
                      handleUpdateMeter(meter.id, nameInput.value, descInput.value);
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Meter Info
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Section: Display, Localization & Logging Interval */}
          <Card className="p-5 bg-white dark:bg-[#18181b] border-slate-200/80 dark:border-[#26262b] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                System Preferences &amp; Telemetry Logging
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Telemetry Logging Interval (Flexible 1 min default) */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/70 dark:bg-[#18181b] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
                    Logging Interval
                  </label>
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <select
                  value={settings.historyIntervalSeconds || 60}
                  onChange={(e) => handleUpdateSetting('historyIntervalSeconds', parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#26262b] bg-white dark:bg-[#18181b] text-xs font-medium outline-none cursor-pointer"
                >
                  <option value={10}>10 Seconds (High Freq)</option>
                  <option value={30}>30 Seconds</option>
                  <option value={60}>60 Seconds (1 Minute · Recommended)</option>
                  <option value={120}>2 Minutes</option>
                  <option value={300}>5 Minutes</option>
                </select>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Database snapshot frequency
                </span>
              </div>

              {/* Display Timezone */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/70 dark:bg-[#18181b] space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
                  Display Timezone
                </label>
                <select
                  value={settings.displayTimezone}
                  onChange={(e) => handleUpdateSetting('displayTimezone', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#26262b] bg-white dark:bg-[#18181b] text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
                  <option value="UTC">UTC (Universal)</option>
                </select>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Timestamp formatting
                </span>
              </div>

              {/* Stale Threshold */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/70 dark:bg-[#18181b] space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
                  Stale Data Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={settings.staleAfterSeconds}
                  onChange={(e) => handleUpdateSetting('staleAfterSeconds', parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#26262b] bg-white dark:bg-[#18181b] text-xs font-medium tabular-nums"
                />
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Offline detection threshold
                </span>
              </div>

              {/* Theme Preference */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/70 dark:bg-[#18181b] space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
                  Interface Theme
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      handleUpdateSetting('theme', 'dark');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent font-semibold'
                        : 'bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#26262b]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      handleUpdateSetting('theme', 'light');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'bg-slate-900 text-white border-transparent font-semibold'
                        : 'bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#26262b]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Light
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Visual presentation mode
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Alarm Threshold Rules */}
      {activeTab === 'alarms' && (
        <Card className="p-5 bg-white dark:bg-[#18181b] border-slate-200/80 dark:border-[#26262b] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#26262b]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Alarm Threshold Rules
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Evaluates automatically on incoming telemetry
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {alarmRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/70 dark:bg-[#18181b] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-slate-900 dark:text-slate-100">
                      {rule.description || `${rule.parameter} ${rule.operator} ${rule.threshold}`}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                      {rule.meterId || 'All Meters'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Condition: {rule.parameter} {rule.operator} {rule.threshold}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500 font-medium">Threshold:</label>
                    <input
                      type="number"
                      defaultValue={rule.threshold}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== rule.threshold) {
                          handleRuleThresholdChange(rule.id, val);
                        }
                      }}
                      className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-[#26262b] bg-white dark:bg-[#18181b] text-xs font-mono font-bold tabular-nums text-right"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleRuleToggle(rule.id, rule.enabled)}
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 w-16">
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
