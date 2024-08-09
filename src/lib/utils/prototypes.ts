String.prototype.indexOfAll = function (needle: string, relativeIndex = false) {
    let index = 0;
    const founds: number[] = [];

    while (index < this.length) {
        const found = this.substring(index).indexOf(needle);

        if (found === -1) {
            return founds;
        }

        founds.push(found + (relativeIndex ? 0 : index));

        index = index + found + needle.length;
    }

    return founds;
};

Array.prototype.findOrThrow = function <T>(cb: (item: T, index: number) => boolean): T {
    const result = this.find(cb) as T | undefined;

    if (!result) {
        throw new Error('Cannot find any item');
    }

    return result;
};
