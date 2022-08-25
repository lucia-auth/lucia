```ts
const checkValidity = async () => {
    if (refreshHandler.isTokenValid) return
    if (refreshHandler.refreshPromise) {
        return await refreshHandler.refreshPromise
    }
    await refreshHandler.refreshToken()
}

const refreshToken = async () => {

}

refreshHandler.pause()
refreshHandler.start()
```

