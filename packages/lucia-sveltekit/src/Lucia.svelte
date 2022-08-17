<script lang="ts">
    import {
        onDestroy,
        onMount,
        createEventDispatcher,
        setContext,
    } from "svelte";
    import { LuciaError } from "./utils/error.js";
    import { getSession, refreshTokens } from "./client.js";
    import { page } from "$app/stores";
    import { writable } from "svelte/store";

    const disptach = createEventDispatcher();

    let interval: NodeJS.Timer;
    setContext("__lucia__", {
        session: writable($page.data.lucia),
    });
    const lucia = getSession();
    onMount(() => {
        let isRefreshInProgress = false;
        interval = setInterval(async () => {
            try {
                if (!$lucia?.access_token || !$lucia?.refresh_token) return;
                const tokenData = getJwtPayload($lucia?.access_token);
                const currentTime = new Date().getTime();
                if (!isRefreshInProgress) return;
                if (!tokenData) {
                    throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
                }
                if (!tokenData.exp) {
                    throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
                }
                if (currentTime + 60 * 1000 > tokenData.exp * 1000) {
                    isRefreshInProgress = true;
                    await refresh($lucia?.refresh_token);
                }
            } catch (e) {
                const error = e as LuciaError;
                console.error(error);
                clearInterval(interval);
                return disptach("error", error.message);
            }
            isRefreshInProgress = false;
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });

    const refresh = async (refreshTokenVal: string) => {
        const result = await refreshTokens(refreshTokenVal);
        if (!$lucia) return;
        $lucia.refresh_token = result.refresh_token;
        $lucia.access_token = result.access_token;
    };

    const getJwtPayload = (token: string) => {
        return JSON.parse(window.atob(token.split(".")[1]));
    };
</script>

<slot />
