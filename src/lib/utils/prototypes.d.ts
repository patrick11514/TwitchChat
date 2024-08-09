declare global {
    interface String {
        indexOfAll(needle: string, relativeIndex?: boolean): number[];
    }

    interface Array<T> {
        findOrThrow(cb: (item: T, index: number) => boolean): T;
    }
}

export {};
