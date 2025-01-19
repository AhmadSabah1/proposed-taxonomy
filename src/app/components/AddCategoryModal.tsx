// components/AddCategoryModal.tsx
import React, { useState } from 'react';
import { Category } from '@/app/models/Category';
import { v4 as uuidv4 } from 'uuid';

interface AddCategoryModalProps {
    isVisible: boolean;
    onClose: () => void;
    onAddCategory: (newCategory: Category) => void;
    parentCategory?: Category | null;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
                                                               isVisible,
                                                               onClose,
                                                               onAddCategory,
                                                               parentCategory,
                                                           }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    if (!isVisible) return null;

    const handleAddCategory = () => {
        const newCategory: Category = {
            id: uuidv4(),
            name,
            description,
            children: [],
        };
        onAddCategory(newCategory);
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-lg font-semibold mb-4">
                    {parentCategory ? 'Add Subcategory' : 'Add Category'}
                </h3>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border p-2 rounded w-full mb-2"
                    placeholder="Name"
                />
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border p-2 rounded w-full mb-2"
                    placeholder="Description"
                />
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddCategory}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;
