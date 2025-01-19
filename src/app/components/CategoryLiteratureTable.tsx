// components/CategoryLiteratureTable.tsx
'use client';

import React from 'react';
import { Literature } from '@/app/models/Literature';
import { Category } from '@/app/models/Category';

interface CategoryLiteratureTableProps {
    category: Category | null;
    literatureList: Literature[];
    detachLiteratureFromCategory: (literatureId: string) => void;
}

const CategoryLiteratureTable: React.FC<CategoryLiteratureTableProps> = ({
                                                                             category,
                                                                             literatureList,
                                                                             detachLiteratureFromCategory,
                                                                         }) => {
    if (!category) {
        return (
            <div className="w-full bg-gray-100 p-4 overflow-y-auto h-screen">
                <p>Select a category to view its literature.</p>
            </div>
        );
    }

    // Get the literature items attached to this category
    const attachedLiterature = literatureList.filter((lit) =>
        category.literatureIds?.includes(lit.id)
    );

    return (
        <div className="w-full bg-gray-100 p-4 overflow-y-auto h-screen">
            <h3 className="text-lg font-semibold mb-4">
                Literature for "{category.name}"
            </h3>

            {attachedLiterature.length > 0 ? (
                <table className="min-w-full border text-sm">
                    <thead>
                    <tr>
                        <th className="px-2 py-1 border">Title</th>
                        <th className="px-2 py-1 border">Author</th>
                        <th className="px-2 py-1 border">Date</th>
                        <th className="px-2 py-1 border">URL</th>
                        <th className="px-2 py-1 border">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {attachedLiterature.map((lit) => (
                        <tr key={lit.id}>
                            <td className="px-2 py-1 border">{lit.title}</td>
                            <td className="px-2 py-1 border">{lit.author || 'N/A'}</td>
                            <td className="px-2 py-1 border">{lit.date || 'N/A'}</td>
                            <td className="px-2 py-1 border">
                                <a
                                    href={lit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500"
                                >
                                    Link
                                </a>
                            </td>
                            <td className="px-2 py-1 border">
                                <button
                                    onClick={() => detachLiteratureFromCategory(lit.id)}
                                    className="text-red-500"
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <p>No literature attached to this category.</p>
            )}
        </div>
    );
};

export default CategoryLiteratureTable;
