import { Action, ActionPanel, getPreferenceValues, List, LocalStorage, open } from "@raycast/api";
import { useEffect, useState } from "react";
import fetch from "node-fetch";
import { Octokit } from "octokit";

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
  // TODO 数据结构变更，这里需要支持 Map，可以存储其他数据，例如 group id
  subSpacesIds: string[];
};

type GroupMap = Record<string, GroupInfo>;

export type StoreType = {
  selectedGroupId: string;

  allSpacesMap: {
    [key: string]: SpaceInfo;
  };

  groups: GroupInfo[];

  groupsSort: string[];
  groupsMap: GroupMap;

  archiveSpaces?: GroupInfo;

  // 每次同步完成后，更新版本号
  version: number;

  alreadyBackupToGist?: boolean;

  redirect?: boolean;
};

type Preference = {
  GistToken: string;
  GistId: string;
};

export const getGistData = async ({ filename }: { filename: string }): Promise<StoreType> => {
  const preferences = getPreferenceValues<Preference>();

  const { GistToken: token, GistId: gistId } = preferences;
  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: fetch,
    },
  });

  const res = await octokit.request("GET /gists/{gist_id}", {
    gist_id: gistId,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  console.log("res.data.files", res.data.files);
  console.log("filename", filename);

  // @ts-expect-error
  return JSON.parse(res.data.files[filename].content);
};

export default function Command() {
  const [fileData, setFileData] = useState<StoreType>();
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    const SYNC_FILE_NAME = "sync_data.json";
    LocalStorage.getItem("data").then((data) => {
      const cachedData = JSON.parse((data as string) || "{}");
      const currentTime = Date.now();
      // 缓存有效期 2 分钟
      if (cachedData && Object.keys(cachedData).length) {
        setFileData(cachedData);
      }

      if (typeof cachedData.__cacheTime === "number" && currentTime - cachedData.__cacheTime < 1000 * 60) {
        return;
      }

      getGistData({
        filename: SYNC_FILE_NAME,
      }).then((data) => {
        LocalStorage.setItem(
          "data",
          JSON.stringify({
            ...data,
            __cacheTime: Date.now(),
          }),
        );
        setFileData(data);
        // console.log("data", data);
      });
    });
  }, []);

  return (
    <List filtering={false} searchText={searchText} onSearchTextChange={setSearchText}>
      {Object.values(fileData?.groupsMap || {}).map((group) => {
        return group.subSpacesIds.map((spaceId) => {
          const space = fileData?.allSpacesMap[spaceId];
          return space?.tabs.filter(tab => {
            const lowerCaseTitle = tab.title.toLowerCase();
            const lowerCaseSpaceName = (space?.name || '').toLowerCase();
            const lowerSearchText = searchText.toLowerCase();

            return (lowerCaseTitle).includes(lowerSearchText) || lowerCaseSpaceName.includes(lowerSearchText);
          }).map((tab) => {
            return (
              <List.Item
                key={tab.id}
                title={tab.title}
                icon={tab.favIconUrl}
                keywords={[group.name, space?.name]}
                accessories={[
                  {
                    text: group.name + "/" + space.name,
                  },
                ]}
                // open in browser
                actions={
                  <ActionPanel>
                    <Action
                      title=""
                      onAction={() => {
                        open(`chrome-extension://bcpiihgpkjpbehkdkeoalgnknfjlkffc/src/pages/newtab/index.html?spaceId=${spaceId}&tabId=${tab.id}`, "com.google.Chrome");
                        // open in edge browser
                        // open(
                        //   `chrome-extension://bcpiihgpkjpbehkdkeoalgnknfjlkffc/src/pages/newtab/index.html?spaceId=${spaceId}&tabId=${tab.id}`,
                        //   "com.microsoft.edgemac",
                        // );
                      }}
                    />
                  </ActionPanel>
                }
              />
            );
          });
        });
      })}
      {/* <List.Item
        icon="list-icon.png"
        title="Greeting"
        actions={
          <ActionPanel>
            <Action.Push title="Show Details" target={<Detail markdown="# Hey! 👋" />} />
          </ActionPanel>
        }
      /> */}
    </List>
  );
}
