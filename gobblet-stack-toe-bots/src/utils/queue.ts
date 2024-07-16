export default class Queue<T> {
    private head: Node<T> | null;
    private tail: Node<T> | null;

    constructor() {
        this.head = null;
        this.tail = null;
    }

    public isEmpty(): boolean {
        return this.head === null;
    }

    public add(element: T): void {
        if (this.isEmpty()) {
            this.head = new Node(element);
            this.tail = this.head;
        } else {
            this.tail.next = new Node(element);
            this.tail = this.tail.next;
        }
    }

    public remove(): T {
        if (this.isEmpty()) {
            throw new Error('Cannot remove from an empty queue');
        }

        const removedElement = this.head.element;
        if (this.head === this.tail) {
            this.head = null;
            this.tail = null;
        } else {
            this.head = this.head.next;
        }

        return removedElement;
    }
}

class Node<T> {
    element: T;
    next: Node<T> | null;

    constructor(element: T) {
        this.element = element;
    }
}