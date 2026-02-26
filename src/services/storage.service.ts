/**
 * Service to abstract browser storage (localStorage).
 * Adheres to the Dependency Inversion Principle by providing a stable interface
 * that doesn't depend directly on the global window.localStorage object.
 */
class StorageService {
    /**
     * Retrieves an item from storage by its key.
     * @param key The key of the item to retrieve.
     * @returns The item value or null if not found.
     */
    getItem<T = string>(key: string): T | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const value = localStorage.getItem(key);
            if (!value) return null;

            // Try to parse as JSON if it looks like a JSON string
            if (
                (value.startsWith('{') && value.endsWith('}')) ||
                (value.startsWith('[') && value.endsWith(']')) ||
                value === 'null' ||
                value === 'true' ||
                value === 'false' ||
                (!isNaN(Number(value)) && value.trim() !== '')
            ) {
                try {
                    return JSON.parse(value) as T;
                } catch {
                    return value as unknown as T;
                }
            }

            return value as unknown as T;
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
            return null;
        }
    }

    /**
     * Saves an item to storage.
     * @param key The key to save the item under.
     * @param value The value to save.
     */
    setItem(key: string, value: any): void {
        try {
            if (typeof localStorage === 'undefined') return;
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, stringValue);
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }

    /**
     * Removes an item from storage.
     * @param key The key of the item to remove.
     */
    removeItem(key: string): void {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from localStorage key "${key}":`, error);
        }
    }

    /**
     * Clears all items from storage.
     */
    clear(): void {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
}

export const storageService = new StorageService();
