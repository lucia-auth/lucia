<script lang="ts">
    import type { Writable } from "svelte/store";
    import { onDestroy, onMount, createEventDispatcher } from "svelte";
    import { LuciaError } from "./utils/error.js";
    import { refreshTokens } from "./client.js";

    const disptach = createEventDispatcher();

    export let session: Writable<App.Session>;

    let interval: NodeJS.Timer;

    onMount(() => {
        let isRefreshInProgress = false;
        interval = setInterval(async () => {
            try {
                if (
                    !$session.lucia?.access_token ||
                    !$session.lucia?.refresh_token
                )
                    return;
                const tokenData = getJwtPayload($session.lucia?.access_token);
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
                    await refresh($session.lucia?.refresh_token);
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
        if (!$session.lucia) return;
        $session.lucia.refresh_token = result.refresh_token;
        $session.lucia.access_token = result.access_token;
    };

    const getJwtPayload = (token: string) => {
        return JSON.parse(window.atob(token.split(".")[1]));
    };
</script>

<slot />
