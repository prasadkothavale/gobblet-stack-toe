export default class AtomicReference<T> {
    private value: T | null;;

    constructor(value: T | null) {
        this.value = value;
    }

    public get(): T {
        return this.value;
    }

    public set(value: T): void {
        this.value = value;
    }
}