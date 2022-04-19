export const sleep = async (ms: number) => {
    return new Promise((r, j) => {
        setTimeout(() => {
            r(ms)
        }, ms)
    })
}

