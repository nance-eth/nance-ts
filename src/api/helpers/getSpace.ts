/* eslint-disable prefer-promise-reject-errors */
import { SpaceInfoExtended, DateEvent, SQLSpaceConfig, InternalDateEvent } from "@nance/nance-sdk";
import { sum } from "lodash";
import { getCurrentEvent, getCurrentGovernanceCycleDay, getNextEvents } from "@/calendar/events";
import { getNextEventByName } from "./getNextEventByName";
import { addDaysToDate, DEFAULT_SPACE_AVATAR, IPFS_GATEWAY } from "@/utils";
import { getSysDb } from "@/dolt/pools";

export const getSpaceInfo = (spaceConfig: SQLSpaceConfig): SpaceInfoExtended => {
  const { cycleStageLengths, cycleStartReference } = spaceConfig;
  const { currentGovernanceCycle } = spaceConfig;
  let nextEvents: InternalDateEvent[] = [];
  let currentEvent: InternalDateEvent | null = null;
  let currentCycleDay = 0;
  if (cycleStageLengths) {
    nextEvents = getNextEvents(cycleStartReference, cycleStageLengths, new Date());
    currentEvent = getCurrentEvent(cycleStartReference, cycleStageLengths, new Date(), nextEvents);
    currentCycleDay = getCurrentGovernanceCycleDay(currentEvent, cycleStageLengths, new Date());
  }
  let cycleStartDate = getNextEventByName("Temperature Check", spaceConfig)?.start || new Date();
  // if this the cycle start date is in the past, then we are currently in "Temperature Check" and need to add cycle days
  if (cycleStartDate < new Date()) {
    cycleStartDate = addDaysToDate(cycleStartDate, sum(cycleStageLengths));
  }
  const stringCurrentEvent: DateEvent = {
    title: currentEvent?.title || "Unknown",
    start: currentEvent?.start?.toISOString() || "",
    end: currentEvent?.end?.toISOString() || "",
  };

  const stringNextEvents = nextEvents.reduce((acc, event, index) => {
    if (index === 0) return acc;
    if (acc.map((e) => e.title).includes(event.title)) return acc;
    return [...acc, { title: event.title, start: event.start.toISOString(), end: event.end.toISOString() }];
  }, [] as DateEvent[]);

  const avatar = spaceConfig.avatar || DEFAULT_SPACE_AVATAR;

  const cycleTriggerTime = cycleStartReference?.toISOString().split("T")[1] || "00:00:00";
  return {
    name: spaceConfig.space,
    displayName: spaceConfig.displayName || spaceConfig.space,
    avatarURL: `${IPFS_GATEWAY}/ipfs/${avatar}`,
    currentCycle: currentGovernanceCycle,
    cycleStartDate: cycleStartDate.toISOString(),
    currentEvent: stringCurrentEvent,
    nextEvents: stringNextEvents,
    currentCycleDay,
    cycleTriggerTime,
    dialog: { ...spaceConfig.dialogHandlerMessageIds },
    config: spaceConfig.config,
    spaceOwners: spaceConfig.spaceOwners,
    snapshotSpace: spaceConfig.config.snapshot.space || "",
    juiceboxProjectId: spaceConfig.config.juicebox.projectId || "",
    proposalSubmissionValidation: spaceConfig.config.proposalSubmissionValidation,
    transactorAddress: {
      type: spaceConfig.config.juicebox.gnosisSafeAddress ? 'safe' : 'governor',
      network: spaceConfig.config.juicebox.network,
      address: spaceConfig.config.juicebox.gnosisSafeAddress ||
        spaceConfig.config.juicebox.governorAddress || "",
    }
  };
};

export const getAllSpaceInfo = async (where?: string): Promise<SpaceInfoExtended[]> => {
  try {
    const spaceConfigs = await getSysDb().getAllSpaceConfig(where);
    const spaceInfos = await Promise.all(spaceConfigs.map(async (entry) => {
      return getSpaceInfo(entry);
    }));
    const filteredSpaceInfoArray = spaceInfos.filter((entry) => entry !== undefined) as SpaceInfoExtended[];
    return filteredSpaceInfoArray;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getSpaceConfig = async (space: string): Promise<SQLSpaceConfig> => {
  try {
    const entry = await getSysDb().getSpaceConfig(space);
    return entry;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAllSpaceConfig = async (where?: string): Promise<SQLSpaceConfig[]> => {
  try {
    return await getSysDb().getAllSpaceConfig(where);
  } catch (e) {
    return Promise.reject(e);
  }
};

// subkeys of NanceConfig we want to query by
export type GetSpaceByConfigKeyName =
  | "discord.guildId"
  | "snapshot.space";
export const getSpaceByConfigValue = async (key: GetSpaceByConfigKeyName, value: any): Promise<SQLSpaceConfig> => {
  try {
    return await getSysDb().getSpaceByConfigValue(key, value);
  } catch (e) {
    return Promise.reject(e);
  }
};
