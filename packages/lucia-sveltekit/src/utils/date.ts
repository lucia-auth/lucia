export const getTimeAfterSeconds = (seconds: number) => {
    return new Date().getTime() + 1000 * seconds;
}