import { Action, ActionPanel, getPreferenceValues, List, LocalStorage, open } from "@raycast/api";
import { useEffect, useState } from "react";
import { useTabSearch } from "./google-chrome/src/hooks/useTabSearch";
import { ChromeListItems } from "./google-chrome/src/components";
import { getGistData } from "./util/get-gist-data";
import { PreferenceOptions, StoreType } from "./util/type";
import { BrowserMapApplication } from "./util/constant";

const usePinTabData = () => {
  const [fileData, setFileData] = useState<StoreType>();
  const [cacheIconData, setCacheIconData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fn = async () => {
      const storageStoreData = await LocalStorage.getItem("data").then((data) => {
        return JSON.parse((data as string) || "{}") as StoreType & { __cacheTime?: number };
      });
      const storageIconData = await LocalStorage.getItem("iconData").then((data) => {
        return JSON.parse((data as string) || "{}") as Record<string, string>;
      });

      const currentTime = Date.now();
      // 缓存有效期 2 分钟
      if (storageStoreData && Object.keys(storageStoreData).length) {
        setFileData(storageStoreData);
      }
      if (storageIconData && Object.keys(storageIconData).length) {
        setCacheIconData(storageIconData);
      }

      if (typeof storageStoreData.__cacheTime === "number" && currentTime - storageStoreData.__cacheTime < 1000 * 60) {
        return;
      }

      const { storeData, cacheImgBase64Map } = await getGistData();
      await LocalStorage.setItem("iconData", JSON.stringify(cacheImgBase64Map));
      await LocalStorage.setItem(
        "data",
        JSON.stringify({
          ...storeData,
          __cacheTime: Date.now(),
        }),
      );
    };

    fn();
  }, []);

  return { fileData, cacheIconData };
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");
  const { fileData, cacheIconData } = usePinTabData();
  const { data } = useTabSearch();

  return (
    <List filtering={false} searchText={searchText} onSearchTextChange={setSearchText}>
      {searchText &&
        data
          .filter((tab) => {
            return (
              tab.title.toLowerCase().includes(searchText.toLowerCase()) ||
              tab.url.toLowerCase().includes(searchText.toLowerCase())
            );
          })
          .map((tab) => <ChromeListItems.TabList key={tab.key()} tab={tab} useOriginalFavicon={false} />)}

      {Object.values(fileData?.groupsMap || {}).map((group) => {
        return group.subSpacesIds.map((spaceId) => {
          const space = fileData?.allSpacesMap[spaceId];
          return space?.tabs
            .filter((tab) => {
              const lowerCaseTitle = tab.title.toLowerCase();
              const lowerCaseSpaceName = (space?.name || "").toLowerCase();
              const lowerSearchText = searchText.toLowerCase();

              return lowerCaseTitle.includes(lowerSearchText) || lowerCaseSpaceName.includes(lowerSearchText);
            })
            .map((tab) => {
              return (
                <List.Item
                  key={tab.id}
                  title={tab.title}
                  icon={cacheIconData[tab.favIconUrl] || tab.favIconUrl}
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
                          open(
                            `chrome-extension://bcpiihgpkjpbehkdkeoalgnknfjlkffc/src/pages/newtab/index.html?spaceId=${spaceId}&tabId=${tab.id}`,
                            BrowserMapApplication[getPreferenceValues<PreferenceOptions>().DefaultBrowser] || BrowserMapApplication.chrome,
                          );
                        }}
                      />
                    </ActionPanel>
                  }
                />
              );
            });
        });
      })}

    </List>
  );
}
