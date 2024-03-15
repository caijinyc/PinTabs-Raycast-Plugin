import { DefaultBrowser } from "./constant";

export type PreferenceOptions = {
  GistToken: string;
  GistId: string;
  DefaultBrowser: (typeof DefaultBrowser)[keyof typeof DefaultBrowser];
  ExtensionID: string
};

export type TabInfo = {
  id: number;
  title: string;
  url: string;
  favIconUrl: string;

  customTitle?: string;
  active?: boolean;
  groupId?: number;
  pinned?: boolean;
};

export type SpaceInfo = {
  name: string;
  groupId?: number;
  tabs: TabInfo[];
  uuid: string;
};

export type GroupInfo = {
  name: string;
  id: string;
  subSpacesIds: string[];
};

export type GroupMap = Record<string, GroupInfo>;
export type StoreType = {
  selectedGroupId: string;

  allSpacesMap: {
    [key: string]: SpaceInfo;
  };

  groupsSort: string[];
  groupsMap: GroupMap;

  archiveSpaces?: GroupInfo;

  // 每次同步完成后，更新版本号
  version: number;

  alreadyBackupToGist?: boolean;

  redirect?: boolean;
};
