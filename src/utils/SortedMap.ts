// src/utils/SortedMap.ts
export class SortedMap<T extends { id: string }> {
    private items: T[] = [];
    private indexMap: Map<string, number> = new Map();

    /**
     * @param comparator A function to compare two items.
     * For descending order (newest first), you might use:
     *   (a, b) => b.createdAt - a.createdAt
     */
    constructor(private comparator: (a: T, b: T) => number) {}

    /**
     * Adds a new item or updates it if it already exists.
     * Then it resorts the collection.
     */
    public addOrUpdate(item: T): void {
        const existingIndex = this.indexMap.get(item.id);
        if (existingIndex !== undefined) {
            this.items[existingIndex] = item;
        } else {
            this.items.push(item);
        }
        this.sortItems();
    }

    /**
     * Removes an item by its id.
     */
    public removeById(id: string): boolean {
        const index = this.indexMap.get(id);
        if (index === undefined) return false;
        this.items.splice(index, 1);
        this.sortItems();
        return true;
    }

    /**
     * Returns all items in sorted order.
     */
    public getAll(): T[] {
        return this.items;
    }

    /**
     * Returns an item by its id.
     */
    public getById(id: string): T | undefined {
        const index = this.indexMap.get(id);
        return index !== undefined ? this.items[index] : undefined;
    }

    /**
     * Sorts the items array and rebuilds the index map.
     */
    private sortItems(): void {
        this.items.sort(this.comparator);
        this.rebuildIndexMap();
    }

    private rebuildIndexMap(): void {
        this.indexMap.clear();
        this.items.forEach((item, idx) => {
            this.indexMap.set(item.id, idx);
        });
    }
}
