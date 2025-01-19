// models/Category.ts
export interface Category {
    id: string;
    name: string;
    description?: string;
    color?: string;
    children?: Category[];
    parentCategoryId?: string | null;
    literatureIds?: string[]; // References to literature items by ID
}
