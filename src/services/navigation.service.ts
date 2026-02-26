/**
 * Service to abstract browser navigation (window.location).
 * Adheres to the Dependency Inversion Principle by providing a stable interface
 * for navigation and location-related queries.
 */
class NavigationService {
    /**
     * Redirects the browser to a new URL using window.location.assign.
     * @param url The URL to redirect to.
     */
    assign(url: string): void {
        if (typeof window !== 'undefined') {
            window.location.assign(url);
        }
    }

    /**
     * Redirects the browser to a new URL using window.location.replace.
     * @param url The URL to redirect to.
     */
    replace(url: string): void {
        if (typeof window !== 'undefined') {
            window.location.replace(url);
        }
    }

    /**
     * Gets the current path name.
     * @returns The current path name or empty string if not in a browser.
     */
    getPathname(): string {
        if (typeof window !== 'undefined') {
            return window.location.pathname;
        }
        return '';
    }

    /**
     * Reloads the current page.
     */
    reload(): void {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }

    /**
     * Navigates back in browser history.
     */
    goBack(): void {
        if (typeof window !== 'undefined' && window.history) {
            window.history.back();
        }
    }
}

export const navigationService = new NavigationService();
