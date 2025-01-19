// models/Literature.ts
export interface Literature {
    id: string; // Unique identifier
    title: string;
    author?: string;
    date?: string;
    url: string;
    note?: string; // Optional field for a note
    sortOrder: number | undefined;
}
