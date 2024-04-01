import { Action, ActionPanel, getPreferenceValues, List, open } from "@raycast/api";
import { useState } from "react";
import { useTabSearch } from "./google-chrome/src/hooks/useTabSearch";
import { ChromeListItems } from "./google-chrome/src/components";
import { PreferenceOptions } from "./util/type";
import { BrowserMapApplication } from "./util/constant";
import { usePinTabData } from "./util/use-pin-tab-data";
export default function Command() {
  const [searchText, setSearchText] = useState<string>("");
  const { fileData, cacheIconData } = usePinTabData();
  const { data } = useTabSearch();
  const preferences = getPreferenceValues<PreferenceOptions>();


  return (
    <List filtering={false} searchText={searchText} onSearchTextChange={setSearchText}>
      {/*{searchText &&*/}
      {/*  data*/}
      {/*    .filter((tab) => {*/}
      {/*      return (*/}
      {/*        tab.title.toLowerCase().includes(searchText.toLowerCase()) ||*/}
      {/*        tab.url.toLowerCase().includes(searchText.toLowerCase())*/}
      {/*      );*/}
      {/*    })*/}
      {/*    .map((tab) => <ChromeListItems.TabList key={tab.key()} tab={tab} useOriginalFavicon={false} />)}*/}

      {Object.values(fileData?.groupsMap || {}).map((group) => {
        return group.subSpacesIds.filter(item => {
          const archivedSpaceIds = fileData?.groupsMap['__archive']?.subSpacesIds || [];

          return !archivedSpaceIds.includes(item);
        }).map((spaceId) => {
          const space = fileData?.allSpacesMap[spaceId];

          return space?.tabs
            .filter((tab) => {
              const lowerCaseTitle = tab.title.toLowerCase();
              const lowerCaseSpaceName = (space?.name || "").toLowerCase();
              const lowerSearchText = searchText.toLowerCase();

              return lowerCaseTitle.includes(lowerSearchText) || lowerCaseSpaceName.includes(lowerSearchText);
            }).sort((a, b) => {
              return (b.openCount || 0) - (a.openCount || 0);
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
                      tag: {
                        value: group.name + "/" + space.name +  (tab.openCount ? `-${tab.openCount} ` : ''),
                        color: "gray",
                      },
                    },
                  ]}
                  // open in browser
                  actions={
                    <ActionPanel>
                      <Action
                        title=""
                        onAction={() => {
                          open(
                            `chrome-extension://${preferences.ExtensionID ? preferences.ExtensionID : 'mpjgigpdepkhfkgjcjnelffdnimeomao'}/src/pages/newtab/index.html?spaceId=${spaceId}&tabId=${tab.id}`,
                            BrowserMapApplication[getPreferenceValues<PreferenceOptions>().DefaultBrowser] ||
                              BrowserMapApplication.chrome,
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
