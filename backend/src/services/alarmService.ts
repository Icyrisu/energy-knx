import { EventEmitter } from 'node:events';
import { AlarmRule, MeterLiveSnapshot, ParameterKey } from '@energy/shared';
import { alarmRepo } from '../repositories/alarmRepo.js';
import { liveStore } from './liveStore.js';

class AlarmService extends EventEmitter {
  private rules: AlarmRule[] = [];
  private lastRulesRefresh: number = 0;
  private activeAlarmKeys: Set<string> = new Set();

  constructor() {
    super();
  }

  public async refreshRules() {
    try {
      this.rules = await alarmRepo.getRules();
      this.lastRulesRefresh = Date.now();
      const activeAlarms = await alarmRepo.getActiveAlarms();
      this.activeAlarmKeys = new Set(
        activeAlarms.filter((a) => a.ruleId !== null).map((a) => `${a.ruleId}:${a.meterId}`)
      );
      liveStore.setActiveAlarmsCount(activeAlarms.length);
    } catch (err) {
      console.error('Failed to refresh alarm rules:', err);
    }
  }

  public async evaluateSnapshot(snapshot: MeterLiveSnapshot) {
    if (!snapshot.values || snapshot.connectionStatus !== 'online' || snapshot.isStale) {
      return;
    }

    // Refresh rules cache if older than 30s
    if (Date.now() - this.lastRulesRefresh > 30000) {
      await this.refreshRules();
    }

    const relevantRules = this.rules.filter(
      (r) => r.enabled && (!r.meterId || r.meterId === snapshot.meterId)
    );

    for (const rule of relevantRules) {
      const val = snapshot.values[rule.parameter as ParameterKey];
      if (val === undefined || val === null || !Number.isFinite(val)) continue;

      const key = `${rule.id}:${snapshot.meterId}`;
      let isBreached = false;
      let isCleared = false;

      if (rule.operator === '>') {
        if (val > rule.threshold) {
          isBreached = true;
        } else if (val < rule.threshold - rule.hysteresis) {
          isCleared = true;
        }
      } else if (rule.operator === '<') {
        if (val < rule.threshold) {
          isBreached = true;
        } else if (val > rule.threshold + rule.hysteresis) {
          isCleared = true;
        }
      }

      if (isBreached && !this.activeAlarmKeys.has(key)) {
        try {
          const raised = await alarmRepo.raiseEvent({
            ruleId: rule.id,
            meterId: snapshot.meterId,
            parameter: rule.parameter,
            alarmType: `${rule.parameter} ${rule.operator} ${rule.threshold}`,
            value: val,
            threshold: rule.threshold,
            severity: rule.severity,
          });

          this.activeAlarmKeys.add(key);
          liveStore.setActiveAlarmsCount(this.activeAlarmKeys.size);

          this.emit('alarm', {
            id: raised.id,
            meterId: raised.meterId,
            parameter: raised.parameter,
            severity: raised.severity,
            status: 'active',
            message: rule.description || `${raised.parameter} breached threshold`,
            raisedAt: raised.raisedAt,
          });
        } catch {
          // Rule already has an active alarm event
          this.activeAlarmKeys.add(key);
        }
      } else if (isCleared && this.activeAlarmKeys.has(key)) {
        try {
          const cleared = await alarmRepo.clearActiveEventByRule(rule.id, snapshot.meterId);
          this.activeAlarmKeys.delete(key);
          liveStore.setActiveAlarmsCount(this.activeAlarmKeys.size);

          if (cleared) {
            this.emit('alarm', {
              id: cleared.id,
              meterId: cleared.meterId,
              parameter: cleared.parameter,
              severity: cleared.severity,
              status: 'cleared',
              message: `${cleared.parameter} returned to normal level`,
              raisedAt: cleared.raisedAt,
            });
          }
        } catch (err) {
          console.error('Failed to clear alarm:', err);
        }
      }
    }
  }
}

export const alarmService = new AlarmService();
