import { getPreferenceValues } from "@raycast/api";
import { Octokit } from "octokit";
import fetch from "node-fetch";
import { PreferenceOptions, StoreType } from "./type";

export const getGistData = async () => {
  const preferences = getPreferenceValues<PreferenceOptions>();

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

  return {
    storeData: JSON.parse(res.data.files?.[SYNC_FILE_NAME]?.content || "{}") as StoreType,
    cacheImgBase64Map: JSON.parse(res.data.files?.[CACHE_FAVICON_FILE_NAME]?.content || "{}") as Record<string, string>,
  };
};
export const SYNC_FILE_NAME = "sync_data.json";
export const CACHE_FAVICON_FILE_NAME = "cacheImgBase64Map.json";