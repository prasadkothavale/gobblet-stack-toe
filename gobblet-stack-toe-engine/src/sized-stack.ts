export interface Sized {
    size: number;
}

export default class SizedStack<T extends Sized> {
    stack: T[] = [];

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

    public toArray(): T[] {
        return this.stack.slice();
    }

    public toString(): string {
        return JSON.stringify(this.stack);
    }
}