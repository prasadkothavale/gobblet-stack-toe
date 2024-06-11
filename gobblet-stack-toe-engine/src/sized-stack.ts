export interface Sized {
    size: number;
}

export default class SizedStack<T extends Sized> {
    stack: T[];

    constructor(items?: T[]) {
        this.stack = [];
        items ? this.pushArray(items) : undefined
    }

    public canPush(item: T): boolean {
        return this.isEmpty() || this.peek().size < item.size;
    }
    
    public push(item: T): void {
        if (this.canPush(item)) {
            this.stack.push(item);
        } else {
            throw new Error(`Cannot push item: ${JSON.stringify(item)}, to stack: ${this.toString()}`);
        }
    }

    public pushArray(items: T[]): void {
        items.forEach((item: T) =>  this.push(item))
    }

    public pop(): T | null{
        return this.stack.pop();
    }

    public peek(): T {
        return this.stack[this.stack.length - 1];
    }

    public isEmpty(): boolean {
        return this.stack.length === 0;
    }

    public size(): number {
        return this.stack.length;
    }

    public clear(): void {
        this.stack = [];
    }

    public clone(): SizedStack<T> {
        const clone: SizedStack<T> = new SizedStack<T>();
        clone.stack = this.stack.slice();
        return clone;
    }

    public toArray(): T[] {
        return this.stack.slice();
    }

    public toString(): string {
        return JSON.stringify(this.stack);
    }
}