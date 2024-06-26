export default class SortedArray<T> {
    private array: T[];
    private comparator: (a: T, b: T) => number;

    public constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator;
        this.array = [];
    }

    public toArray(): T[] {
        return this.array.slice();
    }

    public loadSortedArray(array: T[], comparator: (a: T, b: T) => number): void {
        this.array = array;
        this.comparator = comparator;
    }

    public push(item: T): void {
        if (this.array.length === 0) {
            this.array.push(item);
            return;
        }

        const mid = Math.round(this.array.length / 2) - 1;
        this.comparator(item, this.array[mid]) < 0 ?
            this.binarySortInsert(item, 0, mid) :
            this.binarySortInsert(item, mid + 1, this.array.length);
    }

    public find(item: T): T | null {
        if (this.array.length === 0) {
            return null;
        }

        const mid: number = Math.round(this.array.length / 2) - 1;
        if (this.comparator(this.array[mid], item) === 0) {
            return this.array[mid];
        }
        return this.comparator(item, this.array[mid]) < 0 ?
            this.binarySearch(item, 0, mid) :
            this.binarySearch(item, mid + 1, this.array.length);
    }

    private binarySortInsert(item: T, start: number, end: number): void {
        if (start == end ) {
            this.array.splice(start, 0, item);
            return;
        }

        const mid: number = Math.round((start + end) / 2) - 1;
        this.comparator(item, this.array[mid]) < 0?
            this.binarySortInsert(item, start, mid) :
            this.binarySortInsert(item, mid + 1, end);
    }

    private binarySearch(item: T, start: number, end: number): T | null {
        if (start === end) {
            return null;
        }

        const mid: number = Math.round((start + end) / 2) - 1;
        if (this.comparator(this.array[mid], item) === 0) {
            return this.array[mid];
        }

        return this.comparator(item, this.array[mid]) < 0?
            this.binarySearch(item, start, mid) :
            this.binarySearch(item, mid + 1, end);

    }
}