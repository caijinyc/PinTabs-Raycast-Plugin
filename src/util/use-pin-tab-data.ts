import { useEffect, useState } from "react";
import { StoreType } from "./type";
import { LocalStorage } from "@raycast/api";
import { getGistData } from "./get-gist-data";

export const usePinTabData = () => {
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
          __cacheTime: Date.now()
        })
      );
    };

    fn();
  }, []);

  return { fileData, cacheIconData };
};