export function chunk<T>(arr: T[], chunkLength: number): T[][] {
    const chunks: T[][] = [];
    let i = 0;

    while (i < arr.length) {
        chunks.push(arr.slice(i, i + chunkLength));
        i += chunkLength;
    }

    return chunks;
}
